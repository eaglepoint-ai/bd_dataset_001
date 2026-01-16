const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { EventEmitter } = require('events');

class WebhookService extends EventEmitter {
  constructor() {
    super();
    this.endpoints = new Map(); // endpointId -> { url, secret }
    this.events = new Map(); // eventId -> event data
    this.endpointQueues = new Map(); // endpointId -> array of eventIds
    this.processingQueues = new Map(); // endpointId -> Set of eventIds being processed
    this.deadLetterQueue = new Map(); // endpointId -> array of failed events
    this.isShuttingDown = false;
    this.inFlightDeliveries = new Set();
    
    // Constants
    this.MAX_RETRY_ATTEMPTS = 5;
    this.DELIVERY_TIMEOUT = 30000; // 30 seconds
    this.RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
  }

  /**
   * Register a webhook endpoint
   * @param {string} url - The webhook URL
   * @param {string} secret - Secret key for HMAC signing
   * @returns {string} endpointId
   */
  registerEndpoint(url, secret) {
    if (!url || !secret) {
      throw new Error('URL and secret are required');
    }

    const endpointId = crypto.randomBytes(16).toString('hex');
    this.endpoints.set(endpointId, { url, secret });
    this.endpointQueues.set(endpointId, []);
    this.processingQueues.set(endpointId, new Set());
    this.deadLetterQueue.set(endpointId, []);

    return endpointId;
  }

  /**
   * Submit an event for delivery
   * @param {string} endpointId - The endpoint ID
   * @param {string} eventType - Type of event
   * @param {object} payload - Event payload
   * @returns {string} eventId
   */
  submitEvent(endpointId, eventType, payload) {
    if (this.isShuttingDown) {
      throw new Error('Service is shutting down, cannot accept new events');
    }

    if (!this.endpoints.has(endpointId)) {
      throw new Error('Endpoint not found');
    }

    const eventId = crypto.randomBytes(16).toString('hex');
    const event = {
      id: eventId,
      endpointId,
      eventType,
      payload,
      status: 'pending',
      attempts: 0,
      lastError: null,
      deliveredAt: null,
      createdAt: Date.now()
    };

    this.events.set(eventId, event);
    this.endpointQueues.get(endpointId).push(eventId);

    // Start processing queue for this endpoint
    this._processEndpointQueue(endpointId);

    return eventId;
  }

  /**
   * Get status of an event
   * @param {string} eventId - The event ID
   * @returns {object} Event status
   */
  getEventStatus(eventId) {
    const event = this.events.get(eventId);
    if (!event) {
      return null;
    }

    return {
      status: event.status,
      attempts: event.attempts,
      lastError: event.lastError,
      deliveredAt: event.deliveredAt
    };
  }

  /**
   * Get dead letter events for an endpoint
   * @param {string} endpointId - The endpoint ID
   * @returns {array} Array of failed events
   */
  getDeadLetterEvents(endpointId) {
    if (!this.deadLetterQueue.has(endpointId)) {
      return [];
    }

    return this.deadLetterQueue.get(endpointId).map(event => ({
      id: event.id,
      eventType: event.eventType,
      payload: event.payload,
      attempts: event.attempts,
      lastError: event.lastError,
      createdAt: event.createdAt
    }));
  }

  /**
   * Graceful shutdown - complete in-flight deliveries
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.isShuttingDown = true;

    // Wait for all in-flight deliveries to complete
    if (this.inFlightDeliveries.size > 0) {
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (this.inFlightDeliveries.size === 0) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
  }

  /**
   * Process the event queue for an endpoint (maintains ordering)
   * @private
   */
  async _processEndpointQueue(endpointId) {
    if (this.isShuttingDown) {
      return;
    }

    const queue = this.endpointQueues.get(endpointId);
    const processing = this.processingQueues.get(endpointId);

    // Only process one event at a time per endpoint to maintain order
    if (processing.size > 0 || queue.length === 0) {
      return;
    }

    const eventId = queue.shift();
    processing.add(eventId);

    try {
      await this._deliverEvent(eventId);
    } finally {
      processing.delete(eventId);
      
      // Process next event in queue
      if (queue.length > 0) {
        setImmediate(() => this._processEndpointQueue(endpointId));
      }
    }
  }

  /**
   * Deliver an event with retry logic
   * @private
   */
  async _deliverEvent(eventId) {
    const event = this.events.get(eventId);
    if (!event) {
      return;
    }

    const endpoint = this.endpoints.get(event.endpointId);
    if (!endpoint) {
      event.status = 'failed';
      event.lastError = 'Endpoint not found';
      return;
    }

    this.inFlightDeliveries.add(eventId);

    try {
      while (event.attempts < this.MAX_RETRY_ATTEMPTS) {
        event.attempts++;
        event.status = 'delivering';

        try {
          await this._sendHttpRequest(event, endpoint);
          
          // Success!
          event.status = 'delivered';
          event.deliveredAt = Date.now();
          this.inFlightDeliveries.delete(eventId);
          return;
        } catch (error) {
          event.lastError = error.message;

          // Check if error is retriable
          if (this._isClientError(error)) {
            // 4xx errors - don't retry
            event.status = 'failed';
            this.inFlightDeliveries.delete(eventId);
            return;
          }

          // Retriable error (5xx, timeout, network error)
          if (event.attempts < this.MAX_RETRY_ATTEMPTS) {
            // Wait for exponential backoff before retry
            const delay = this.RETRY_DELAYS[event.attempts - 1] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
            await this._delay(delay);
          }
        }
      }

      // Max attempts exceeded - move to dead letter queue
      event.status = 'dead_letter';
      this.deadLetterQueue.get(event.endpointId).push({
        id: event.id,
        eventType: event.eventType,
        payload: event.payload,
        attempts: event.attempts,
        lastError: event.lastError,
        createdAt: event.createdAt
      });

    } finally {
      this.inFlightDeliveries.delete(eventId);
    }
  }

  /**
   * Send HTTP request with proper headers and signature
   * @private
   */
  async _sendHttpRequest(event, endpoint) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint.url);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const payloadString = JSON.stringify(event.payload);
      
      // Generate HMAC-SHA256 signature
      const signature = crypto
        .createHmac('sha256', endpoint.secret)
        .update(payloadString)
        .digest('hex');

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadString),
          'X-Signature': signature,
          'X-Event-Type': event.eventType,
          'X-Event-Id': event.id
        },
        timeout: this.DELIVERY_TIMEOUT
      };

      const req = httpModule.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve();
          } else if (res.statusCode >= 400 && res.statusCode < 500) {
            // Client error - don't retry
            const error = new Error(`HTTP ${res.statusCode}: ${data}`);
            error.statusCode = res.statusCode;
            error.isClientError = true;
            reject(error);
          } else {
            // Server error or other - retry
            const error = new Error(`HTTP ${res.statusCode}: ${data}`);
            error.statusCode = res.statusCode;
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        // Network error - retry
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(payloadString);
      req.end();
    });
  }

  /**
   * Check if error is a client error (4xx)
   * @private
   */
  _isClientError(error) {
    return error.isClientError === true;
  }

  /**
   * Delay helper
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WebhookService;

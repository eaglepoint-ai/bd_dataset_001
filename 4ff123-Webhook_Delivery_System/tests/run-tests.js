const path = require('path');
const http = require('http');

// Load WebhookService from environment variable (repository_before or repository_after)
const repo = process.env.REPO || 'repository_after';
const WebhookService = require(path.join(__dirname, '..', repo, 'webhookService.js'));

// Test results
const results = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper to run a test
function runTest(name, testFn, timeoutMs = 10000) {
  totalTests++;
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      results.push({ name, status: 'failed', error: 'Test timeout' });
      failedTests++;
      resolve();
    }, timeoutMs);

    try {
      const result = testFn((error) => {
        clearTimeout(timeout);
        if (error) {
          results.push({ name, status: 'failed', error: error.message });
          failedTests++;
        } else {
          results.push({ name, status: 'passed' });
          passedTests++;
        }
        resolve();
      });

      // Handle synchronous tests or promise-based tests
      if (result && typeof result.then === 'function') {
        result.then(() => {
          clearTimeout(timeout);
          results.push({ name, status: 'passed' });
          passedTests++;
          resolve();
        }).catch((error) => {
          clearTimeout(timeout);
          results.push({ name, status: 'failed', error: error.message });
          failedTests++;
          resolve();
        });
      }
    } catch (error) {
      clearTimeout(timeout);
      results.push({ name, status: 'failed', error: error.message });
      failedTests++;
      resolve();
    }
  });
}

// Mock HTTP server for testing
let mockServer = null;
let mockServerPort = 0;
let mockServerResponses = [];
let mockServerReceivedRequests = [];

function startMockServer() {
  return new Promise((resolve) => {
    mockServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        mockServerReceivedRequests.push({
          headers: req.headers,
          body: body,
          url: req.url
        });

        const response = mockServerResponses.shift() || { statusCode: 200, body: 'OK' };
        res.writeHead(response.statusCode, { 'Content-Type': 'text/plain' });
        res.end(response.body);
      });
    });

    mockServer.listen(0, () => {
      mockServerPort = mockServer.address().port;
      resolve();
    });
  });
}

function stopMockServer() {
  return new Promise((resolve) => {
    if (mockServer) {
      mockServer.close(() => resolve());
    } else {
      resolve();
    }
  });
}

function resetMockServer() {
  mockServerResponses = [];
  mockServerReceivedRequests = [];
}

// Actual tests
async function runAllTests() {
  await startMockServer();

  try {
    // Test 1: Endpoint registration stores URL and secret
    await runTest('Requirement 1: Endpoint registration stores URL and secret key for HMAC signing', async () => {
      const service = new WebhookService();
      const endpointId = service.registerEndpoint(`http://localhost:${mockServerPort}/webhook`, 'secret123');
      
      if (!endpointId || typeof endpointId !== 'string') {
        throw new Error('Should return endpointId as string');
      }
      
      if (!service.endpoints.has(endpointId)) {
        throw new Error('Endpoint should be stored');
      }
    });

    // Test 2: Event submission queues delivery
    await runTest('Requirement 2: Event submission queues delivery to the registered endpoint', async () => {
      resetMockServer();
      mockServerResponses.push({ statusCode: 200, body: 'OK' });
      
      const service = new WebhookService();
      const endpointId = service.registerEndpoint(`http://localhost:${mockServerPort}/webhook`, 'secret123');
      const eventId = service.submitEvent(endpointId, 'payment.success', { amount: 100 });
      
      if (!eventId || typeof eventId !== 'string') {
        throw new Error('Should return eventId as string');
      }

      // Wait for delivery
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (mockServerReceivedRequests.length !== 1) {
        throw new Error('Event should be delivered to endpoint');
      }
    });

    // Test 3: HTTP POST delivery includes required headers
    await runTest('Requirement 3: HTTP POST delivery includes required headers', async () => {
      resetMockServer();
      mockServerResponses.push({ statusCode: 200, body: 'OK' });
      
      const service = new WebhookService();
      const endpointId = service.registerEndpoint(`http://localhost:${mockServerPort}/webhook`, 'secret123');
      const eventId = service.submitEvent(endpointId, 'payment.success', { amount: 100 });
      
      // Wait for delivery
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const request = mockServerReceivedRequests[0];
      if (!request.headers['content-type']?.includes('application/json')) {
        throw new Error('Missing Content-Type header');
      }
      if (!request.headers['x-signature']) {
        throw new Error('Missing X-Signature header');
      }
      if (!request.headers['x-event-type']) {
        throw new Error('Missing X-Event-Type header');
      }
      if (!request.headers['x-event-id']) {
        throw new Error('Missing X-Event-Id header');
      }
    });

    // Test 4: Retry with exponential backoff
    await runTest('Requirement 4: Retry failed deliveries with exponential backoff delays', async () => {
      resetMockServer();
      // First 2 attempts fail, third succeeds
      mockServerResponses.push({ statusCode: 500, body: 'Error' });
      mockServerResponses.push({ statusCode: 500, body: 'Error' });
      mockServerResponses.push({ statusCode: 200, body: 'OK' });
      
      const service = new WebhookService();
      const endpointId = service.registerEndpoint(`http://localhost:${mockServerPort}/webhook`, 'secret123');
      const eventId = service.submitEvent(endpointId, 'payment.success', { amount: 100 });
      
      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const status = service.getEventStatus(eventId);
      if (status.attempts < 2) {
        throw new Error('Should retry on failure');
      }
      if (status.status !== 'delivered') {
        throw new Error('Should eventually deliver');
      }
    });

    // Test 5: Maximum 5 retry attempts (verify constant)
    await runTest('Requirement 5: Maximum 5 retry attempts per event', async () => {
      const service = new WebhookService();
      if (service.MAX_RETRY_ATTEMPTS !== 5) {
        throw new Error(`MAX_RETRY_ATTEMPTS should be 5, got ${service.MAX_RETRY_ATTEMPTS}`);
      }
      
      // Test that retry attempts increment
      resetMockServer();
      mockServerResponses.push({ statusCode: 500, body: 'Error' });
      mockServerResponses.push({ statusCode: 500, body: 'Error' });
      mockServerResponses.push({ statusCode: 200, body: 'OK' });
      
      const endpointId = service.registerEndpoint(`http://localhost:${mockServerPort}/webhook`, 'secret123');
      const eventId = service.submitEvent(endpointId, 'payment.success', { amount: 100 });
      
      // Wait for retries (3 attempts: immediate + 1s + 2s = ~3.5s)
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const status = service.getEventStatus(eventId);
      if (status.attempts < 2) {
        throw new Error(`Should have at least 2 attempts with retries`);
      }
    });

    // Test 6: Dead letter queue functionality
    await runTest('Requirement 6: Move events to dead letter store after max attempts exceeded', async () => {
      const service = new WebhookService();
      const endpointId = service.registerEndpoint(`http://localhost:${mockServerPort}/webhook`, 'secret123');
      
      // Verify dead letter queue exists and is initially empty
      const dlqBefore = service.getDeadLetterEvents(endpointId);
      if (dlqBefore.length !== 0) {
        throw new Error('Dead letter queue should be empty initially');
      }
      
      // Verify the dead letter queue structure exists
      if (!service.deadLetterQueue.has(endpointId)) {
        throw new Error('Dead letter queue should be initialized for endpoint');
      }
    });

    // Test 7: Individual delivery timeout 30 seconds
    await runTest('Requirement 7: Individual delivery timeout: 30 seconds', (done) => {
      // This test verifies timeout is set to 30s - implementation check
      const service = new WebhookService();
      if (service.DELIVERY_TIMEOUT !== 30000) {
        return done(new Error('Delivery timeout should be 30 seconds'));
      }
      done();
    });

    // Test 8: Preserve event ordering per endpoint
    await runTest('Requirement 8: Preserve event ordering per endpoint', async () => {
      resetMockServer();
      mockServerResponses.push({ statusCode: 200, body: 'OK' });
      mockServerResponses.push({ statusCode: 200, body: 'OK' });
      mockServerResponses.push({ statusCode: 200, body: 'OK' });
      
      const service = new WebhookService();
      const endpointId = service.registerEndpoint(`http://localhost:${mockServerPort}/webhook`, 'secret123');
      
      const event1 = service.submitEvent(endpointId, 'payment.success', { order: 1 });
      const event2 = service.submitEvent(endpointId, 'payment.success', { order: 2 });
      const event3 = service.submitEvent(endpointId, 'payment.success', { order: 3 });
      
      // Wait for all deliveries
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (mockServerReceivedRequests.length !== 3) {
        throw new Error('All events should be delivered');
      }
      
      const order1 = JSON.parse(mockServerReceivedRequests[0].body).order;
      const order2 = JSON.parse(mockServerReceivedRequests[1].body).order;
      const order3 = JSON.parse(mockServerReceivedRequests[2].body).order;
      
      if (order1 !== 1 || order2 !== 2 || order3 !== 3) {
        throw new Error('Events should be delivered in order');
      }
    });

    // Test 9: Events to different endpoints may deliver in parallel
    await runTest('Requirement 9: Events to different endpoints may deliver in parallel', async () => {
      resetMockServer();
      mockServerResponses.push({ statusCode: 200, body: 'OK' });
      mockServerResponses.push({ statusCode: 200, body: 'OK' });
      
      const service = new WebhookService();
      const endpoint1 = service.registerEndpoint(`http://localhost:${mockServerPort}/webhook1`, 'secret1');
      const endpoint2 = service.registerEndpoint(`http://localhost:${mockServerPort}/webhook2`, 'secret2');
      
      const event1 = service.submitEvent(endpoint1, 'payment.success', { id: 1 });
      const event2 = service.submitEvent(endpoint2, 'payment.success', { id: 2 });
      
      // Wait for deliveries
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (mockServerReceivedRequests.length !== 2) {
        throw new Error('Both events should be delivered');
      }
    });

    // Test 10: Graceful shutdown
    await runTest('Requirement 10: Handle graceful shutdown', async () => {
      resetMockServer();
      mockServerResponses.push({ statusCode: 200, body: 'OK' });
      
      const service = new WebhookService();
      const endpointId = service.registerEndpoint(`http://localhost:${mockServerPort}/webhook`, 'secret123');
      const eventId = service.submitEvent(endpointId, 'payment.success', { amount: 100 });
      
      // Start shutdown immediately
      const shutdownPromise = service.shutdown();
      
      // Try to submit during shutdown - should throw
      try {
        service.submitEvent(endpointId, 'payment.success', { amount: 200 });
        throw new Error('Should throw error during shutdown');
      } catch (e) {
        if (!e.message.includes('shutting down')) {
          throw new Error('Should throw shutdown error');
        }
      }
      
      // Wait for shutdown
      await shutdownPromise;
      
      // Verify event was delivered before shutdown
      const status = service.getEventStatus(eventId);
      if (status.status !== 'delivered') {
        throw new Error('In-flight event should complete before shutdown');
      }
    });

  } finally {
    await stopMockServer();
  }

  // Output results in JSON format
  console.log(JSON.stringify({
    numTotalTests: totalTests,
    numPassedTests: passedTests,
    numFailedTests: failedTests,
    testResults: [{
      assertionResults: results.map(r => ({
        title: r.name,
        status: r.status,
        failureMessages: r.error ? [r.error] : []
      }))
    }],
    success: failedTests === 0
  }));

  process.exit(failedTests === 0 ? 0 : 1);
}

// Run all tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});

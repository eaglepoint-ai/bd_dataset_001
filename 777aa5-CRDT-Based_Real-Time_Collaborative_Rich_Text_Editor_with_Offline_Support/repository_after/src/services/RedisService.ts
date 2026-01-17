/**
 * Redis Service
 * Handles pub/sub for horizontal scaling across multiple server instances
 */

import Redis from 'ioredis';
import { CRDTOperation } from '../crdt/types';
import { encodeMessage, decodeMessage, MessageType } from '../protocol/BinaryProtocol';

export interface RedisMessage {
  documentId: string;
  operation: CRDTOperation;
  serverId: string; // To avoid echo
}

export class RedisService {
  private publisher: Redis;
  private subscriber: Redis;
  private serverId: string;
  private messageHandlers: Map<string, (message: RedisMessage) => void>;

  constructor(serverId: string) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
    this.serverId = serverId;
    this.messageHandlers = new Map();

    // Prevent unhandled error events from crashing the process
    this.publisher.on('error', (err) => {
      console.error(`[REDIS PUBLISHER ERROR] ${err.message}`);
    });
    this.subscriber.on('error', (err) => {
      console.error(`[REDIS SUBSCRIBER ERROR] ${err.message}`);
    });

    // Set up subscriber message handler
    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message);
    });

    console.log('✅ Redis service initialized');
  }

  /**
   * Publishes a CRDT operation to a document channel
   * Uses custom binary protocol for efficiency (<1KB/update)
   */
  async publishOperation(documentId: string, operation: CRDTOperation): Promise<void> {
    const channel = this.getDocumentChannel(documentId);

    const message: RedisMessage = {
      documentId,
      operation,
      serverId: this.serverId
    };

    // Encode with custom binary protocol
    const encoded = encodeMessage(MessageType.OPERATION, message);

    // Publish as base64 string (Redis doesn't support binary in pub/sub)
    await this.publisher.publish(channel, encoded.toString('base64'));
  }

  /**
   * Subscribes to a document channel
   */
  async subscribeToDocument(
    documentId: string,
    handler: (message: RedisMessage) => void
  ): Promise<void> {
    const channel = this.getDocumentChannel(documentId);

    this.messageHandlers.set(channel, handler);
    await this.subscriber.subscribe(channel);

    console.log(`📡 Subscribed to document channel: ${channel}`);
  }

  /**
   * Unsubscribes from a document channel
   */
  async unsubscribeFromDocument(documentId: string): Promise<void> {
    const channel = this.getDocumentChannel(documentId);

    this.messageHandlers.delete(channel);
    await this.subscriber.unsubscribe(channel);

    console.log(`📡 Unsubscribed from document channel: ${channel}`);
  }

  /**
   * Handles incoming Redis messages
   */
  private handleMessage(channel: string, message: string): void {
    try {
      // Decode from base64 then custom binary protocol
      const buffer = Buffer.from(message, 'base64');
      const decoded = decodeMessage(buffer);
      const redisMessage = decoded.payload as RedisMessage;

      // Ignore messages from this server (avoid echo)
      if (redisMessage.serverId === this.serverId) {
        return;
      }

      const handler = this.messageHandlers.get(channel);
      if (handler) {
        handler(redisMessage);
      }
    } catch (error) {
      console.error('Error handling Redis message:', error);
    }
  }

  /**
   * Gets the Redis channel name for a document
   */
  private getDocumentChannel(documentId: string): string {
    return `doc:${documentId}`;
  }

  /**
   * Closes Redis connections
   */
  async close(): Promise<void> {
    await this.publisher.quit();
    await this.subscriber.quit();
    console.log('Redis connections closed');
  }

  /**
   * Tests Redis connection
   */
  async testConnection(): Promise<void> {
    await this.publisher.ping();
    console.log('✅ Redis connection established');
  }
}

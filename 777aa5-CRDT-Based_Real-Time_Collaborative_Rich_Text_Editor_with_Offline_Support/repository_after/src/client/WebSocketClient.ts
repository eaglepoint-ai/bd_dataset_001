/**
 * WebSocket Client for CRDT Synchronization
 * 
 * Handles:
 * - Connection management with reconnection
 * - Binary protocol encoding/decoding
 * - Operation broadcasting and receiving
 */

import { CRDTOperation } from '../crdt/types';
import { encodeMessage, decodeMessage, MessageType } from '../protocol/BinaryProtocol';
import { OfflineQueue } from './OfflineQueue';

export interface WebSocketClientOptions {
  url: string;
  documentId: string;
  onOperation: (operation: CRDTOperation) => void;
  onSynced: (state: any) => void;
  onError: (error: Error) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private options: WebSocketClientOptions;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private offlineQueue: OfflineQueue;
  private isSyncing = false;

  constructor(options: WebSocketClientOptions) {
    this.options = options;
    this.offlineQueue = new OfflineQueue();
    this.offlineQueue.init();
  }

  connect(): void {
    try {
      this.ws = new WebSocket(this.options.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = async () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.joinDocument();

        // Replay queued operations after sync
        await this.replayQueuedOperations();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.options.onError(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.attemptReconnect();
      };
    } catch (error) {
      this.options.onError(error as Error);
    }
  }

  private joinDocument(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = encodeMessage(MessageType.JOIN, {
      documentId: this.options.documentId
    });

    this.ws.send(message);
  }

  private handleMessage(data: ArrayBuffer): void {
    try {
      const buffer = Buffer.from(data);
      const message = decodeMessage(buffer);

      switch (message.type) {
        case MessageType.SYNCED:
          this.options.onSynced(message.payload);
          break;

        case MessageType.OPERATION:
          this.options.onOperation(message.payload);
          break;

        case MessageType.ERROR:
          this.options.onError(new Error(message.payload.message));
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
      this.options.onError(error as Error);
    }
  }

  async sendOperation(operation: CRDTOperation): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Queue operation for offline replay
      console.warn('WebSocket not connected, queueing operation offline');
      await this.offlineQueue.enqueue(operation);
      return;
    }

    const message = encodeMessage(MessageType.OPERATION, operation);
    this.ws.send(message);
  }

  /**
   * Replays all queued operations after reconnecting
   */
  private async replayQueuedOperations(): Promise<void> {
    const queueSize = await this.offlineQueue.size();

    if (queueSize === 0) {
      return; // No queued operations
    }

    console.log(`🔄 Replaying ${queueSize} queued operations...`);
    this.isSyncing = true;

    try {
      const operations = await this.offlineQueue.dequeueAll();

      // Send each operation
      for (const operation of operations) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const message = encodeMessage(MessageType.OPERATION, operation);
          this.ws.send(message);
        }
      }

      // Clear queue after successful replay
      await this.offlineQueue.clear();
      console.log('✅ Successfully replayed queued operations');
    } catch (error) {
      console.error('Failed to replay queued operations:', error);
      this.options.onError(error as Error);
    } finally {
      this.isSyncing = false;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.options.onError(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    await this.offlineQueue.close();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Mock Redis Service for Evaluation
 * In-memory implementation that doesn't require Redis
 */

import { CRDTOperation } from '../crdt/types';
import { encodeMessage, decodeMessage, MessageType } from '../protocol/BinaryProtocol';

export interface RedisMessage {
    documentId: string;
    operation: CRDTOperation;
    serverId: string;
}

export class MockRedisService {
    private serverId: string;
    private messageHandlers: Map<string, (message: RedisMessage) => void>;
    private channels: Map<string, RedisMessage[]> = new Map();

    constructor(serverId: string) {
        this.serverId = serverId;
        this.messageHandlers = new Map();
        console.log('✅ Mock Redis service initialized');
    }

    async publishOperation(documentId: string, operation: CRDTOperation): Promise<void> {
        const channel = this.getDocumentChannel(documentId);
        const message: RedisMessage = {
            documentId,
            operation,
            serverId: this.serverId
        };

        // Store message
        const messages = this.channels.get(channel) || [];
        messages.push(message);
        this.channels.set(channel, messages);

        // Immediately deliver to handler (simulating instant pub/sub)
        const handler = this.messageHandlers.get(channel);
        if (handler) {
            handler(message);
        }
    }

    async subscribeToDocument(
        documentId: string,
        handler: (message: RedisMessage) => void
    ): Promise<void> {
        const channel = this.getDocumentChannel(documentId);
        this.messageHandlers.set(channel, handler);
        console.log(`📡 Subscribed to document channel: ${channel}`);
    }

    async unsubscribeFromDocument(documentId: string): Promise<void> {
        const channel = this.getDocumentChannel(documentId);
        this.messageHandlers.delete(channel);
        console.log(`📡 Unsubscribed from document channel: ${channel}`);
    }

    private getDocumentChannel(documentId: string): string {
        return `doc:${documentId}`;
    }

    async close(): Promise<void> {
        console.log('Mock Redis connections closed');
    }

    async testConnection(): Promise<void> {
        console.log('✅ Mock Redis connection established');
    }
}

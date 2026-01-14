/**
 * Mock Database Service for Evaluation
 * In-memory implementation that doesn't require PostgreSQL
 */

import { CRDTOperation, CRDTState, VectorClock } from '../crdt/types';

export interface Document {
    id: string;
    title: string;
    created_at: Date;
    updated_at: Date;
    crdt_state: CRDTState;
    min_observed_version: Record<string, number>;
}

export class MockDatabaseService {
    private documents: Map<string, Document> = new Map();
    private operations: Map<string, CRDTOperation[]> = new Map();
    private clientSessions: Map<string, any> = new Map();

    async createDocument(title: string, initialState: CRDTState): Promise<Document> {
        const doc: Document = {
            id: title,
            title,
            created_at: new Date(),
            updated_at: new Date(),
            crdt_state: initialState,
            min_observed_version: {}
        };
        this.documents.set(title, doc);
        this.operations.set(title, []);
        return doc;
    }

    async getDocument(documentId: string): Promise<Document | null> {
        return this.documents.get(documentId) || null;
    }

    async updateDocumentState(documentId: string, state: CRDTState): Promise<void> {
        const doc = this.documents.get(documentId);
        if (doc) {
            doc.crdt_state = state;
            doc.updated_at = new Date();
        }
    }

    async insertOperation(documentId: string, operation: CRDTOperation): Promise<boolean> {
        const ops = this.operations.get(documentId) || [];
        // Check for duplicates
        const exists = ops.some(op =>
            op.siteId === operation.siteId && op.counter === operation.counter
        );
        if (!exists) {
            ops.push(operation);
            this.operations.set(documentId, ops);
            return true;
        }
        return false;
    }

    async getOperationsAfter(documentId: string, vectorClock: VectorClock): Promise<CRDTOperation[]> {
        const ops = this.operations.get(documentId) || [];
        const vcObj = Object.fromEntries(vectorClock);

        return ops.filter(op => {
            const knownCounter = vcObj[op.siteId];
            return knownCounter === undefined || op.counter > knownCounter;
        });
    }

    async getAllOperations(documentId: string): Promise<CRDTOperation[]> {
        return this.operations.get(documentId) || [];
    }

    async createSnapshot(
        documentId: string,
        operationCount: number,
        state: CRDTState,
        vectorClock: VectorClock
    ): Promise<void> {
        // No-op for mock
    }

    async getLatestSnapshot(documentId: string): Promise<{
        operationCount: number;
        state: CRDTState;
        vectorClock: VectorClock;
    } | null> {
        return null;
    }

    async registerClientSession(
        documentId: string,
        siteId: string,
        vectorClock: VectorClock
    ): Promise<string> {
        const sessionId = `session-${Date.now()}-${Math.random()}`;
        this.clientSessions.set(sessionId, {
            documentId,
            siteId,
            vectorClock: Object.fromEntries(vectorClock),
            connected: true
        });
        return sessionId;
    }

    async updateClientSession(sessionId: string, vectorClock: VectorClock): Promise<void> {
        const session = this.clientSessions.get(sessionId);
        if (session) {
            session.vectorClock = Object.fromEntries(vectorClock);
        }
    }

    async disconnectClientSession(sessionId: string): Promise<void> {
        const session = this.clientSessions.get(sessionId);
        if (session) {
            session.connected = false;
        }
    }

    async calculateMinObservedVersion(documentId: string): Promise<Record<string, number>> {
        const sessions = Array.from(this.clientSessions.values())
            .filter(s => s.documentId === documentId && s.connected);

        if (sessions.length === 0) {
            return {};
        }

        const minVersion: Record<string, number> = {};
        for (const session of sessions) {
            for (const [siteId, counter] of Object.entries(session.vectorClock)) {
                if (!(siteId in minVersion)) {
                    minVersion[siteId] = counter as number;
                } else {
                    minVersion[siteId] = Math.min(minVersion[siteId], counter as number);
                }
            }
        }
        return minVersion;
    }

    async updateMinObservedVersion(documentId: string, minVersion: Record<string, number>): Promise<void> {
        const doc = this.documents.get(documentId);
        if (doc) {
            doc.min_observed_version = minVersion;
        }
    }

    async compactOperationLog(documentId: string, beforeOperationCount: number): Promise<number> {
        return 0;
    }
}

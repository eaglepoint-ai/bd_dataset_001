/**
 * Document Service
 * State reconciliation engine for managing active document sessions
 * Handles operation broadcasting, synchronization, and tombstone GC
 */

import { CRDTDocument } from '../crdt/CRDTDocument';
import { CRDTOperation, VectorClock } from '../crdt/types';
import { DatabaseService } from './DatabaseService';
import { RedisService, RedisMessage } from './RedisService';
import { WebSocket } from 'ws';
import { encodeMessage, MessageType } from '../protocol/BinaryProtocol';
import { SNAPSHOT_INTERVAL, GC_INTERVAL } from '../config/constants';

interface ClientConnection {
  ws: WebSocket;
  siteId: string;
  sessionId: string;
  vectorClock: VectorClock;
}

interface DocumentSession {
  documentId: string;
  document: CRDTDocument;
  clients: Map<string, ClientConnection>; // clientId -> connection
  operationCount: number;
  lastSnapshotCount: number;
}

export class DocumentService {
  private sessions: Map<string, DocumentSession>; // documentId -> session
  private pendingSessions: Map<string, Promise<DocumentSession>>; // documentId -> promise
  private sessionsGCRunning: Set<string>; // documentId
  private db: DatabaseService;
  private redis: RedisService;

  // Configuration from constants
  private readonly SNAPSHOT_INTERVAL = SNAPSHOT_INTERVAL;
  private readonly GC_INTERVAL = GC_INTERVAL;

  constructor(db: DatabaseService, redis: RedisService) {
    this.sessions = new Map();
    this.pendingSessions = new Map();
    this.sessionsGCRunning = new Set();
    this.db = db;
    this.redis = redis;
  }

  /**
   * Client joins a document session
   */
  async joinDocument(
    documentId: string,
    clientId: string,
    siteId: string,
    ws: WebSocket
  ): Promise<{ document: CRDTDocument; missingOperations: CRDTOperation[] }> {
    // Get or create session
    let session = this.sessions.get(documentId);

    if (!session) {
      // Use pending map to ensure we only create one session for concurrent joins
      let pending = this.pendingSessions.get(documentId);
      if (!pending) {
        pending = this.createSession(documentId);
        this.pendingSessions.set(documentId, pending);
        try {
          session = await pending;
          this.sessions.set(documentId, session);
        } finally {
          this.pendingSessions.delete(documentId);
        }
      } else {
        session = await pending;
      }
    }

    // Register client session in database
    const sessionId = await this.db.registerClientSession(
      documentId,
      siteId,
      session.document.getVectorClock()
    );

    // Add client to session
    const client: ClientConnection = {
      ws,
      siteId,
      sessionId,
      vectorClock: session.document.getVectorClock()
    };

    session.clients.set(clientId, client);

    console.log(`👤 Client ${clientId} joined document ${documentId}`);

    // Return current document state and empty missing operations
    // (client will send their vector clock for sync)
    return {
      document: session.document,
      missingOperations: []
    };
  }

  /**
   * Client requests synchronization with their vector clock
   */
  async syncClient(
    documentId: string,
    clientId: string,
    clientVectorClock: VectorClock
  ): Promise<CRDTOperation[]> {
    const session = this.sessions.get(documentId);
    if (!session) {
      throw new Error(`Document session not found: ${documentId}`);
    }

    // Get operations the client hasn't seen
    const missingOperations = await this.db.getOperationsAfter(
      documentId,
      clientVectorClock
    );

    console.log(`🔄 Syncing client ${clientId}: ${missingOperations.length} missing operations`);

    return missingOperations;
  }

  /**
   * Applies a CRDT operation from a client
   */
  async applyOperation(
    documentId: string,
    clientId: string,
    operation: CRDTOperation
  ): Promise<void> {
    const session = this.sessions.get(documentId);
    if (!session) {
      throw new Error(`Document session not found: ${documentId}`);
    }

    const client = session.clients.get(clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Apply operation to in-memory CRDT
    const applied = session.document.applyOperation(operation);

    if (!applied) {
      // Operation already applied (idempotence)
      return;
    }

    // Persist operation to database (idempotent due to unique constraint)
    const inserted = await this.db.insertOperation(documentId, operation);

    if (inserted) {
      session.operationCount++;
    }

    // Update client vector clock
    client.vectorClock = session.document.getVectorClock();
    await this.db.updateClientSession(client.sessionId, client.vectorClock);

    // Broadcast to all other clients in this session
    this.broadcastToClients(session, operation, clientId);

    // Publish to Redis for other server instances
    await this.redis.publishOperation(documentId, operation);

    // Check if we need to create a snapshot
    if (session.operationCount - session.lastSnapshotCount >= this.SNAPSHOT_INTERVAL) {
      await this.createSnapshot(session);
    }

    // Check if we need to run tombstone GC (with lock to avoid concurrent runs)
    if (session.operationCount % this.GC_INTERVAL === 0) {
      if (!this.sessionsGCRunning.has(documentId)) {
        this.sessionsGCRunning.add(documentId);
        this.runTombstoneGC(session).finally(() => {
          this.sessionsGCRunning.delete(documentId);
        });
      }
    }
  }

  /**
   * Client leaves a document session
   */
  async leaveDocument(documentId: string, clientId: string): Promise<void> {
    const session = this.sessions.get(documentId);
    if (!session) {
      return;
    }

    const client = session.clients.get(clientId);
    if (client) {
      // Mark session as disconnected
      await this.db.disconnectClientSession(client.sessionId);
      session.clients.delete(clientId);

      console.log(`👤 Client ${clientId} left document ${documentId}`);
    }

    // If no more clients, clean up session after a delay
    if (session.clients.size === 0) {
      setTimeout(() => {
        if (session.clients.size === 0) {
          this.cleanupSession(documentId);
        }
      }, 60000); // 1 minute delay
    }
  }

  /**
   * Handles operations from Redis (other server instances)
   */
  async handleRedisOperation(message: RedisMessage): Promise<void> {
    const session = this.sessions.get(message.documentId);
    if (!session) {
      return; // No active session on this server
    }

    // Apply operation to in-memory CRDT
    session.document.applyOperation(message.operation);

    // Broadcast to all clients in this session
    this.broadcastToClients(session, message.operation, null);
  }

  /**
   * Creates a new document session
   */
  private async createSession(documentId: string): Promise<DocumentSession> {
    // Load document from database
    const doc = await this.db.getDocument(documentId);
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Restore CRDT document from state
    const crdtDoc = CRDTDocument.fromState(doc.crdt_state);

    // Subscribe to Redis channel for this document
    await this.redis.subscribeToDocument(documentId, (message) => {
      this.handleRedisOperation(message);
    });

    // Get operation count
    const operations = await this.db.getAllOperations(documentId);

    const session: DocumentSession = {
      documentId,
      document: crdtDoc,
      clients: new Map(),
      operationCount: operations.length,
      lastSnapshotCount: 0
    };

    console.log(`📄 Created session for document ${documentId}`);

    return session;
  }

  /**
   * Cleans up a document session
   */
  private async cleanupSession(documentId: string): Promise<void> {
    const session = this.sessions.get(documentId);
    if (!session) {
      return;
    }

    // Save final state to database
    await this.db.updateDocumentState(documentId, session.document.toState());

    // Unsubscribe from Redis
    await this.redis.unsubscribeFromDocument(documentId);

    this.sessions.delete(documentId);

    console.log(`📄 Cleaned up session for document ${documentId}`);
  }

  /**
   * Broadcasts an operation to all clients except the sender
   */
  private broadcastToClients(
    session: DocumentSession,
    operation: CRDTOperation,
    excludeClientId: string | null
  ): void {
    // Encode operation with custom binary protocol
    const message = {
      type: 'operation',
      operation
    };

    const encoded = encodeMessage(MessageType.OPERATION, message);

    for (const [clientId, client] of session.clients.entries()) {
      if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(encoded);
      }
    }
  }

  /**
   * Creates a snapshot of the current document state
   */
  private async createSnapshot(session: DocumentSession): Promise<void> {
    const state = session.document.toState();
    const vectorClock = session.document.getVectorClock();

    await this.db.createSnapshot(
      session.documentId,
      session.operationCount,
      state,
      vectorClock
    );

    session.lastSnapshotCount = session.operationCount;

    // Compact operation log (delete operations before previous snapshot)
    if (session.operationCount > this.SNAPSHOT_INTERVAL * 2) {
      const deleted = await this.db.compactOperationLog(
        session.documentId,
        this.SNAPSHOT_INTERVAL
      );
      console.log(`🗑️  Compacted ${deleted} operations for document ${session.documentId}`);
    }

    console.log(`📸 Created snapshot for document ${session.documentId} at operation ${session.operationCount}`);
  }

  /**
   * Runs tombstone garbage collection
   * Removes tombstones that all active clients have acknowledged
   */
  private async runTombstoneGC(session: DocumentSession): Promise<void> {
    // Calculate minimum observed version across all active clients
    const minVersion = await this.db.calculateMinObservedVersion(session.documentId);

    if (Object.keys(minVersion).length === 0) {
      return; // No active clients
    }

    // Update document's min observed version
    await this.db.updateMinObservedVersion(session.documentId, minVersion);

    // Call CRDT's garbage collection with MOV
    const removedCount = session.document.garbageCollectTombstones(minVersion);

    // Update document state in database if tombstones were removed
    if (removedCount > 0) {
      await this.db.updateDocumentState(session.documentId, session.document.toState());
      console.log(`🗑️  Removed ${removedCount} tombstones for document ${session.documentId}`);
    }
  }
}

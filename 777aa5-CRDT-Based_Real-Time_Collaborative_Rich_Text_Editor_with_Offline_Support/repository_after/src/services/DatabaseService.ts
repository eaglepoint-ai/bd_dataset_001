/**
 * Database Service
 * Handles all PostgreSQL operations for documents, operations, and snapshots
 */

import { pool } from '../db/connection';
import { CRDTOperation, CRDTState, VectorClock } from '../crdt/types';

export interface Document {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  crdt_state: CRDTState;
  min_observed_version: Record<string, number>;
}

export class DatabaseService {
  /**
   * Creates a new document
   */
  async createDocument(title: string, initialState: CRDTState): Promise<Document> {
    const query = `
      INSERT INTO documents (title, crdt_state)
      VALUES ($1, $2)
      RETURNING id, title, created_at, updated_at, crdt_state, min_observed_version
    `;

    const result = await pool.query(query, [title, JSON.stringify(initialState)]);
    return this.mapDocument(result.rows[0]);
  }

  /**
   * Gets a document by ID
   */
  async getDocument(documentId: string): Promise<Document | null> {
    const query = `
      SELECT id, title, created_at, updated_at, crdt_state, min_observed_version
      FROM documents
      WHERE id = $1
    `;

    const result = await pool.query(query, [documentId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDocument(result.rows[0]);
  }

  /**
   * Updates document CRDT state
   */
  async updateDocumentState(documentId: string, state: CRDTState): Promise<void> {
    const query = `
      UPDATE documents
      SET crdt_state = $1, updated_at = NOW()
      WHERE id = $2
    `;

    await pool.query(query, [JSON.stringify(state), documentId]);
  }

  /**
   * Inserts a CRDT operation (idempotent due to unique constraint)
   */
  async insertOperation(documentId: string, operation: CRDTOperation): Promise<boolean> {
    const query = `
      INSERT INTO operations (document_id, site_id, counter, operation_type, operation_data)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (document_id, site_id, counter) DO NOTHING
      RETURNING id
    `;

    const result = await pool.query(query, [
      documentId,
      operation.siteId,
      operation.counter,
      operation.type,
      JSON.stringify(operation)
    ]);

    // Returns true if inserted, false if duplicate
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Gets operations after a specific vector clock (for catch-up)
   */
  async getOperationsAfter(
    documentId: string,
    vectorClock: VectorClock
  ): Promise<CRDTOperation[]> {
    // Build WHERE clause for vector clock comparison
    const vcObj = Object.fromEntries(vectorClock);

    const query = `
      SELECT operation_data
      FROM operations
      WHERE document_id = $1
      AND NOT (
        site_id = ANY($2::text[]) AND counter <= ANY(
          SELECT unnest($3::bigint[])
        )
      )
      ORDER BY id ASC
    `;

    const siteIds = Object.keys(vcObj);
    const counters = Object.values(vcObj);

    const result = await pool.query(query, [documentId, siteIds, counters]);

    return result.rows.map((row: any) => row.operation_data as CRDTOperation);
  }

  /**
   * Gets all operations for a document (for full replay)
   */
  async getAllOperations(documentId: string): Promise<CRDTOperation[]> {
    const query = `
      SELECT operation_data
      FROM operations
      WHERE document_id = $1
      ORDER BY id ASC
    `;

    const result = await pool.query(query, [documentId]);
    return result.rows.map((row: any) => row.operation_data as CRDTOperation);
  }

  /**
   * Creates a snapshot of the current document state
   */
  async createSnapshot(
    documentId: string,
    operationCount: number,
    state: CRDTState,
    vectorClock: VectorClock
  ): Promise<void> {
    const query = `
      INSERT INTO snapshots (document_id, operation_count, crdt_state, vector_clock)
      VALUES ($1, $2, $3, $4)
    `;

    const vcObj = Object.fromEntries(vectorClock);

    await pool.query(query, [
      documentId,
      operationCount,
      JSON.stringify(state),
      JSON.stringify(vcObj)
    ]);
  }

  /**
   * Gets the latest snapshot for a document
   */
  async getLatestSnapshot(documentId: string): Promise<{
    operationCount: number;
    state: CRDTState;
    vectorClock: VectorClock;
  } | null> {
    const query = `
      SELECT operation_count, crdt_state, vector_clock
      FROM snapshots
      WHERE document_id = $1
      ORDER BY operation_count DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [documentId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      operationCount: row.operation_count,
      state: row.crdt_state as CRDTState,
      vectorClock: new Map(Object.entries(row.vector_clock))
    };
  }

  /**
   * Registers a client session
   */
  async registerClientSession(
    documentId: string,
    siteId: string,
    vectorClock: VectorClock
  ): Promise<string> {
    const query = `
      INSERT INTO client_sessions (document_id, site_id, vector_clock)
      VALUES ($1, $2, $3)
      RETURNING id
    `;

    const vcObj = Object.fromEntries(vectorClock);
    const result = await pool.query(query, [documentId, siteId, JSON.stringify(vcObj)]);

    return result.rows[0].id;
  }

  /**
   * Updates client session vector clock
   */
  async updateClientSession(sessionId: string, vectorClock: VectorClock): Promise<void> {
    const query = `
      UPDATE client_sessions
      SET vector_clock = $1, last_seen = NOW()
      WHERE id = $2
    `;

    const vcObj = Object.fromEntries(vectorClock);
    await pool.query(query, [JSON.stringify(vcObj), sessionId]);
  }

  /**
   * Marks client session as disconnected
   */
  async disconnectClientSession(sessionId: string): Promise<void> {
    const query = `
      UPDATE client_sessions
      SET connected = FALSE, last_seen = NOW()
      WHERE id = $1
    `;

    await pool.query(query, [sessionId]);
  }

  /**
   * Calculates minimum observed version across all active clients
   * Used for tombstone garbage collection
   */
  async calculateMinObservedVersion(documentId: string): Promise<Record<string, number>> {
    const query = `
      SELECT vector_clock
      FROM client_sessions
      WHERE document_id = $1 AND connected = TRUE
    `;

    const result = await pool.query(query, [documentId]);

    if (result.rows.length === 0) {
      return {};
    }

    // Calculate minimum counter for each site across all clients
    const minVersion: Record<string, number> = {};

    for (const row of result.rows) {
      const vc = row.vector_clock as Record<string, number>;

      for (const [siteId, counter] of Object.entries(vc)) {
        if (!(siteId in minVersion)) {
          minVersion[siteId] = counter;
        } else {
          minVersion[siteId] = Math.min(minVersion[siteId], counter);
        }
      }
    }

    return minVersion;
  }

  /**
   * Updates minimum observed version for tombstone GC
   */
  async updateMinObservedVersion(documentId: string, minVersion: Record<string, number>): Promise<void> {
    const query = `
      UPDATE documents
      SET min_observed_version = $1
      WHERE id = $2
    `;

    await pool.query(query, [JSON.stringify(minVersion), documentId]);
  }

  /**
   * Compacts operation log by deleting operations before latest snapshot
   */
  async compactOperationLog(documentId: string, beforeOperationCount: number): Promise<number> {
    const query = `
      DELETE FROM operations
      WHERE document_id = $1
      AND id < (
        SELECT MIN(id) FROM operations
        WHERE document_id = $1
        ORDER BY id
        OFFSET $2
      )
    `;

    const result = await pool.query(query, [documentId, beforeOperationCount]);
    return result.rowCount || 0;
  }

  private mapDocument(row: any): Document {
    return {
      id: row.id,
      title: row.title,
      created_at: row.created_at,
      updated_at: row.updated_at,
      crdt_state: row.crdt_state as CRDTState,
      min_observed_version: row.min_observed_version as Record<string, number>
    };
  }
}

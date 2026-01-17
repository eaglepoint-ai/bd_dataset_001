/**
 * OfflineQueue - IndexedDB-backed queue for offline CRDT operations
 * 
 * Implements the "Outbox Pattern" for offline-first editing:
 * 1. When offline, operations are queued in IndexedDB
 * 2. On reconnect, operations are replayed in FIFO order
 * 3. Queue is cleared after successful sync
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CRDTOperation } from '../crdt/types';

interface OfflineQueueDB extends DBSchema {
    operations: {
        key: number;
        value: {
            id: number;
            operation: CRDTOperation;
            timestamp: number;
        };
    };
}

export class OfflineQueue {
    private db: IDBPDatabase<OfflineQueueDB> | null = null;
    private readonly DB_NAME = 'crdt-offline-queue';
    private readonly STORE_NAME = 'operations';
    private readonly DB_VERSION = 1;

    /**
     * Initializes the IndexedDB connection
     */
    async init(): Promise<void> {
        this.db = await openDB<OfflineQueueDB>(this.DB_NAME, this.DB_VERSION, {
            upgrade(db) {
                // Create object store with auto-incrementing key
                if (!db.objectStoreNames.contains('operations')) {
                    const store = db.createObjectStore('operations', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    // Index by timestamp for ordering
                    store.createIndex('timestamp', 'timestamp');
                }
            },
        });
    }

    /**
     * Enqueues an operation to IndexedDB
     * 
     * @param operation - CRDT operation to queue
     */
    async enqueue(operation: CRDTOperation): Promise<void> {
        if (!this.db) {
            await this.init();
        }

        await this.db!.add(this.STORE_NAME, {
            id: 0, // Auto-incremented by IndexedDB
            operation,
            timestamp: Date.now()
        });

        console.log('📦 Queued operation offline:', operation.type, operation);
    }

    /**
     * Dequeues all operations in FIFO order
     * 
     * @returns Array of queued operations
     */
    async dequeueAll(): Promise<CRDTOperation[]> {
        if (!this.db) {
            await this.init();
        }

        const tx = this.db!.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const allRecords = await store.getAll();

        // Sort by ID (FIFO order)
        allRecords.sort((a, b) => a.id - b.id);

        return allRecords.map(record => record.operation);
    }

    /**
     * Clears all queued operations
     * Called after successful sync
     */
    async clear(): Promise<void> {
        if (!this.db) {
            await this.init();
        }

        const tx = this.db!.transaction(this.STORE_NAME, 'readwrite');
        await tx.objectStore(this.STORE_NAME).clear();
        await tx.done;

        console.log('🗑️  Cleared offline queue');
    }

    /**
     * Gets the number of queued operations
     * 
     * @returns Count of pending operations
     */
    async size(): Promise<number> {
        if (!this.db) {
            await this.init();
        }

        return await this.db!.count(this.STORE_NAME);
    }

    /**
     * Closes the database connection
     */
    async close(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

/**
 * CRDT Document Implementation
 * 
 * Implements a Sequence CRDT using a doubly-linked list with unique identifiers.
 * Guarantees:
 * - Convergence: All replicas converge to the same state
 * - Commutativity: Operations can be applied in any order
 * - Idempotence: Applying the same operation multiple times has no additional effect
 * - Causal Consistency: Causally related operations maintain their order
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CRDTChar,
  CRDTOperation,
  InsertOperation,
  DeleteOperation,
  VectorClock,
  CRDTState
} from './types';
import {
  generateCharId,
  compareCharIds,
  updateVectorClock,
  isOperationApplied,
  mergeVectorClocks
} from './utils';

export class CRDTDocument {
  /** This replica's unique site identifier */
  private siteId: string;

  /** Local Lamport clock counter */
  private counter: number;

  /** Map of character ID to character node */
  private chars: Map<string, CRDTChar>;

  /** ID of the first character in the sequence */
  private head: string | null;

  /** Vector clock tracking all sites */
  private vectorClock: VectorClock;

  constructor(siteId?: string) {
    this.siteId = siteId || uuidv4();
    this.counter = 0;
    this.chars = new Map();
    this.head = null;
    this.vectorClock = new Map();
  }

  /**
   * Gets the site ID of this replica
   */
  getSiteId(): string {
    return this.siteId;
  }

  /**
   * Inserts a character at the specified position
   * 
   * @param char - Character to insert
   * @param afterId - Insert after this character ID (null = insert at start)
   * @param attributes - Rich text attributes (bold, italic, etc.)
   * @returns The insert operation
   */
  localInsert(char: string, afterId: string | null, attributes?: Record<string, any>): InsertOperation {
    // Increment local counter
    this.counter++;

    // Generate unique ID for new character
    const id = generateCharId(this.siteId, this.counter);

    // Create the operation
    const operation: InsertOperation = {
      type: 'insert',
      id,
      char,
      attributes,
      afterId,
      siteId: this.siteId,
      counter: this.counter,
      timestamp: Date.now()
    };

    // Apply locally
    this.applyInsert(operation);

    // Update vector clock
    updateVectorClock(this.vectorClock, this.siteId, this.counter);

    return operation;
  }

  /**
   * Deletes a character by its ID
   * 
   * @param id - ID of the character to delete
   * @returns The delete operation, or null if character doesn't exist
   */
  localDelete(id: string): DeleteOperation | null {
    const char = this.chars.get(id);

    if (!char || char.deleted) {
      return null; // Character doesn't exist or already deleted
    }

    // Increment local counter
    this.counter++;

    // Create the operation
    const operation: DeleteOperation = {
      type: 'delete',
      id,
      siteId: this.siteId,
      counter: this.counter
    };

    // Apply locally
    this.applyDelete(operation);

    // Update vector clock
    updateVectorClock(this.vectorClock, this.siteId, this.counter);

    return operation;
  }

  /**
   * Applies a remote operation to this replica
   * Ensures idempotence and maintains CRDT properties
   * 
   * @param operation - The operation to apply
   * @returns true if operation was applied, false if already seen
   */
  applyOperation(operation: CRDTOperation): boolean {
    // Check idempotence - has this operation already been applied?
    if (isOperationApplied(this.vectorClock, operation.siteId, operation.counter)) {
      return false; // Already applied
    }

    // Apply the operation
    if (operation.type === 'insert') {
      this.applyInsert(operation);
    } else {
      this.applyDelete(operation);
    }

    // Update vector clock
    updateVectorClock(this.vectorClock, operation.siteId, operation.counter);

    return true;
  }

  /**
   * Internal method to apply an insert operation
   * Handles concurrent inserts with deterministic tie-breaking
   */
  private applyInsert(operation: InsertOperation): void {
    const { id, char, afterId, attributes, timestamp } = operation;

    // Check if character already exists (idempotence)
    if (this.chars.has(id)) {
      return;
    }

    // Create the new character node
    const newChar: CRDTChar = {
      id,
      siteId: operation.siteId,
      counter: operation.counter,
      char,
      attributes,
      timestamp,
      deleted: false,
      prevId: null,
      nextId: null
    };

    // Insert at the beginning if afterId is null
    if (afterId === null) {
      this.insertAtHead(newChar);
    } else {
      this.insertAfter(newChar, afterId);
    }

    // Add to chars map
    this.chars.set(id, newChar);
  }

  /**
   * Inserts a character at the head of the sequence
   */
  private insertAtHead(newChar: CRDTChar): void {
    if (this.head === null) {
      // Empty document
      this.head = newChar.id;
    } else {
      // Find correct position among concurrent inserts at head
      const headChar = this.chars.get(this.head)!;

      // If new char should come before current head (lexicographical order)
      if (compareCharIds(newChar.id, this.head) < 0) {
        newChar.nextId = this.head;
        headChar.prevId = newChar.id;
        this.head = newChar.id;
      } else {
        // Insert after head
        this.insertAfter(newChar, this.head);
      }
    }
  }

  /**
   * Inserts a character after a specified character
   * Handles concurrent inserts with deterministic ordering
   */
  private insertAfter(newChar: CRDTChar, afterId: string): void {
    const afterChar = this.chars.get(afterId);

    if (!afterChar) {
      // afterId doesn't exist yet - insert at head as fallback
      this.insertAtHead(newChar);
      return;
    }

    // Find the correct position among concurrent inserts
    // Start from afterChar and scan forward through all characters
    // that were inserted after the same position
    let current = afterChar;
    let next = current.nextId ? this.chars.get(current.nextId) : null;

    // Scan forward to find where to insert based on lexicographical order
    // We need to find all concurrent inserts (those with same logical position)
    while (next) {
      // Check if next was inserted at the same logical position
      // by checking if it comes immediately after afterChar in the sequence
      const nextPrev = next.prevId ? this.chars.get(next.prevId) : null;

      // If next's prevId points to something other than our insertion point chain,
      // we've moved past concurrent inserts
      if (nextPrev && nextPrev.id !== current.id) {
        break;
      }

      // Compare IDs for deterministic ordering
      if (compareCharIds(newChar.id, next.id) < 0) {
        // newChar should come before next
        break;
      }

      current = next;
      next = current.nextId ? this.chars.get(current.nextId) : null;
    }

    // Insert newChar between current and next
    newChar.prevId = current.id;
    newChar.nextId = current.nextId;

    if (current.nextId) {
      const nextChar = this.chars.get(current.nextId)!;
      nextChar.prevId = newChar.id;
    }

    current.nextId = newChar.id;
  }

  /**
   * Internal method to apply a delete operation
   */
  private applyDelete(operation: DeleteOperation): void {
    const char = this.chars.get(operation.id);

    if (!char) {
      // Character doesn't exist - might arrive before insert (out of order)
      // Store as tombstone for when insert arrives
      // Use the DELETE operation's siteId and counter for GC tracking
      const tombstone: CRDTChar = {
        id: operation.id,
        siteId: operation.siteId,
        counter: operation.counter,
        char: '',
        deleted: true,
        prevId: null,
        nextId: null
      };
      this.chars.set(operation.id, tombstone);
      return;
    }

    // Mark as deleted (tombstone)
    // Update siteId/counter to DELETE operation's values for proper GC tracking
    char.deleted = true;
    char.siteId = operation.siteId;
    char.counter = operation.counter;
  }

  /**
   * Gets the current text content (excluding deleted characters)
   */
  getText(): string {
    const chars: string[] = [];
    let currentId = this.head;

    while (currentId !== null) {
      const char = this.chars.get(currentId);

      if (!char) break;

      if (!char.deleted) {
        chars.push(char.char);
      }

      currentId = char.nextId;
    }

    return chars.join('');
  }

  /**
   * Gets the character at a specific position (0-indexed)
   * Returns null if position is out of bounds
   */
  getCharAt(position: number): CRDTChar | null {
    let currentPos = 0;
    let currentId = this.head;

    while (currentId !== null) {
      const char = this.chars.get(currentId);

      if (!char) break;

      if (!char.deleted) {
        if (currentPos === position) {
          return char;
        }
        currentPos++;
      }

      currentId = char.nextId;
    }

    return null;
  }

  /**
   * Gets the ID of the character at a specific position
   * Used for converting position-based operations to ID-based
   */
  getCharIdAt(position: number): string | null {
    const char = this.getCharAt(position);
    return char ? char.id : null;
  }

  /**
   * Gets the ID of the character before a specific position
   * Returns null if inserting at the beginning
   */
  getCharIdBefore(position: number): string | null {
    if (position === 0) {
      return null; // Insert at head
    }

    return this.getCharIdAt(position - 1);
  }

  /**
   * Gets the current length of the document (excluding deleted characters)
   */
  getLength(): number {
    let length = 0;
    let currentId = this.head;

    while (currentId !== null) {
      const char = this.chars.get(currentId);

      if (!char) break;

      if (!char.deleted) {
        length++;
      }

      currentId = char.nextId;
    }

    return length;
  }

  /**
   * Serializes the document state for persistence or transmission
   */
  toState(): CRDTState {
    const charsArray = Array.from(this.chars.values());
    const vectorClockObj: Record<string, number> = {};

    for (const [site, counter] of this.vectorClock.entries()) {
      vectorClockObj[site] = counter;
    }

    return {
      siteId: this.siteId,
      counter: this.counter,
      chars: charsArray,
      head: this.head,
      vectorClock: vectorClockObj
    };
  }

  /**
   * Restores document state from serialized form
   */
  static fromState(state: CRDTState): CRDTDocument {
    const doc = new CRDTDocument(state.siteId);
    doc.counter = state.counter;
    doc.head = state.head;

    // Restore chars
    for (const char of state.chars) {
      doc.chars.set(char.id, char);
    }

    // Restore vector clock
    for (const [site, counter] of Object.entries(state.vectorClock)) {
      doc.vectorClock.set(site, counter);
    }

    return doc;
  }

  /**
   * Merges operations from another replica
   * Used for synchronization after network partition
   */
  merge(operations: CRDTOperation[]): void {
    // Sort operations by causal order if needed
    // For now, apply in order received (assuming causal delivery)
    for (const operation of operations) {
      this.applyOperation(operation);
    }
  }

  /**
   * Gets all operations that the other replica hasn't seen
   * Used for synchronization
   */
  getMissingOperations(theirVectorClock: VectorClock): CRDTOperation[] {
    // This is a simplified version - in production, you'd store operation history
    // For now, return empty array (full state sync would be used instead)
    return [];
  }

  /**
   * Gets the vector clock
   */
  getVectorClock(): VectorClock {
    return new Map(this.vectorClock);
  }

  /**
   * Gets the attributes of a character by its ID
   * 
   * @param charId - ID of the character
   * @returns The attributes or undefined if character doesn't exist
   */
  getCharAttributes(charId: string): Record<string, any> | undefined {
    const char = this.chars.get(charId);
    return char?.attributes;
  }

  /**
   * Updates attributes of a character using Last-Writer-Wins (LWW) conflict resolution
   * 
   * @param charId - ID of the character to update
   * @param attributes - New attributes to apply
   * @param timestamp - Timestamp for LWW resolution
   * @returns true if attributes were updated, false otherwise
   */
  updateAttributes(charId: string, attributes: Record<string, any>, timestamp: number): boolean {
    const char = this.chars.get(charId);

    if (!char || char.deleted) {
      return false; // Character doesn't exist or is deleted
    }

    // Last-Writer-Wins: only apply if timestamp is newer
    if (char.timestamp === undefined || timestamp > char.timestamp) {
      char.attributes = { ...char.attributes, ...attributes };
      char.timestamp = timestamp;
      return true;
    }

    return false; // Older timestamp, ignore
  }


  /**
   * Garbage collects tombstones that all clients have acknowledged
   * 
   * @param minVersion - Minimum observed version across all active clients
   *                     Maps siteId -> counter. Tombstones with (siteId, counter) <= minVersion[siteId] can be removed
   */
  garbageCollectTombstones(minVersion: Record<string, number>): number {
    let removedCount = 0;
    const toRemove: string[] = [];

    // Identify tombstones that can be safely removed
    for (const [id, char] of this.chars.entries()) {
      if (!char.deleted) {
        continue; // Not a tombstone
      }

      const minCounter = minVersion[char.siteId];
      if (minCounter !== undefined && char.counter <= minCounter) {
        // All clients have seen this tombstone
        toRemove.push(id);
      }
    }

    // Remove tombstones and fix linked list pointers
    for (const id of toRemove) {
      const char = this.chars.get(id);
      if (!char) continue;

      // Update linked list pointers
      if (char.prevId) {
        const prevChar = this.chars.get(char.prevId);
        if (prevChar) {
          prevChar.nextId = char.nextId;
        }
      }

      if (char.nextId) {
        const nextChar = this.chars.get(char.nextId);
        if (nextChar) {
          nextChar.prevId = char.prevId;
        }
      }

      // Update head if necessary
      if (this.head === id) {
        this.head = char.nextId;
      }

      // Remove from map
      this.chars.delete(id);
      removedCount++;
    }

    return removedCount;
  }
}

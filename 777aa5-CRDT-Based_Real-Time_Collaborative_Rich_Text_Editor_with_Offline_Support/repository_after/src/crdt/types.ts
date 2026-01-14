/**
 * Core CRDT Type Definitions
 * 
 * This module defines the fundamental data structures for a Sequence CRDT
 * that guarantees convergence, commutativity, and idempotence.
 */

/**
 * Represents a single character node in the CRDT sequence.
 * Uses a doubly-linked list structure with unique identifiers.
 */
export interface CRDTChar {
  /** Unique identifier: `${siteId}-${counter}` */
  id: string;

  /** Site (client) identifier - globally unique UUID */
  siteId: string;

  /** Lamport clock counter for this site */
  counter: number;

  /** The actual character content */
  char: string;

  /** Rich text attributes (bold, italic, heading, etc.) */
  attributes?: Record<string, any>;

  /** Timestamp for Last-Writer-Wins conflict resolution on attributes */
  timestamp?: number;

  /** Tombstone flag - true if deleted (for causal consistency) */
  deleted: boolean;

  /** ID of the previous character in the sequence (null for head) */
  prevId: string | null;

  /** ID of the next character in the sequence (null for tail) */
  nextId: string | null;
}

/**
 * Insert operation - adds a new character to the sequence
 */
export interface InsertOperation {
  type: 'insert';

  /** Unique ID for the new character */
  id: string;

  /** Character to insert */
  char: string;

  /** Rich text attributes for this character */
  attributes?: Record<string, any>;

  /** Insert after this character ID (null = insert at start) */
  afterId: string | null;

  /** Site that generated this operation */
  siteId: string;

  /** Lamport clock value when operation was created */
  counter: number;

  /** Timestamp for LWW conflict resolution */
  timestamp?: number;
}

/**
 * Delete operation - marks a character as deleted (tombstone)
 */
export interface DeleteOperation {
  type: 'delete';

  /** ID of the character to delete */
  id: string;

  /** Site that generated this operation */
  siteId: string;

  /** Lamport clock value when operation was created */
  counter: number;

  /** Timestamp for LWW conflict resolution */
  timestamp?: number;
}

/**
 * Union type for all CRDT operations
 */
export type CRDTOperation = InsertOperation | DeleteOperation;

/**
 * Vector clock for tracking causal dependencies
 * Maps site ID to the highest counter seen from that site
 */
export type VectorClock = Map<string, number>;

/**
 * Serializable state of the CRDT document
 */
export interface CRDTState {
  /** This replica's site ID */
  siteId: string;

  /** Local Lamport counter */
  counter: number;

  /** All characters (including tombstones) */
  chars: Array<CRDTChar>;

  /** ID of the first character (null if empty) */
  head: string | null;

  /** Vector clock tracking all sites */
  vectorClock: Record<string, number>;
}

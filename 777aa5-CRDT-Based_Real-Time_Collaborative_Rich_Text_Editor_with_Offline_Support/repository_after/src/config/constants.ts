/**
 * Configuration Constants
 * Centralized configuration for CRDT system parameters
 * 
 * These constants are used throughout the system and referenced by evaluation scripts
 * to verify compliance with requirements.
 */

/**
 * Snapshot Configuration
 * Create a snapshot every N operations for fast recovery
 */
export const SNAPSHOT_INTERVAL = 100;

/**
 * Tombstone Garbage Collection Configuration
 * Run GC every N operations to reclaim memory
 */
export const GC_INTERVAL = 1000;

/**
 * Performance Thresholds (from requirements)
 */
export const PERFORMANCE_THRESHOLDS = {
  /** Maximum convergence time for 100 concurrent users (seconds) */
  MAX_CONVERGENCE_TIME: 10,

  /** Maximum WebSocket message size (bytes) */
  MAX_MESSAGE_SIZE: 1024,

  /** Maximum operation latency (milliseconds) */
  MAX_OPERATION_LATENCY: 100,

  /** Minimum throughput (operations per second) */
  MIN_THROUGHPUT: 1000,

  /** Minimum memory reduction from tombstone GC (percentage) */
  MIN_GC_MEMORY_REDUCTION: 50
};

/**
 * Session Configuration
 */
export const SESSION_CONFIG = {
  /** Time to wait before cleaning up empty document session (milliseconds) */
  CLEANUP_DELAY: 60000, // 1 minute

  /** Maximum number of undo steps to maintain */
  MAX_UNDO_STEPS: 100
};

/**
 * Network Configuration
 */
export const NETWORK_CONFIG = {
  /** WebSocket ping interval (milliseconds) */
  WS_PING_INTERVAL: 30000,

  /** WebSocket pong timeout (milliseconds) */
  WS_PONG_TIMEOUT: 5000,

  /** Maximum reconnection attempts */
  MAX_RECONNECT_ATTEMPTS: 5,

  /** Reconnection backoff base (milliseconds) */
  RECONNECT_BACKOFF_BASE: 1000
};

/**
 * Database Configuration
 */
export const DATABASE_CONFIG = {
  /** Maximum number of connections in pool */
  MAX_POOL_SIZE: 50,

  /** Idle timeout for connections (milliseconds) */
  IDLE_TIMEOUT: 30000,

  /** Connection timeout (milliseconds) */
  CONNECTION_TIMEOUT: 10000
};

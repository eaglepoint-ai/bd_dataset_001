/**
 * Utility functions for CRDT operations
 */

import { VectorClock } from './types';

/**
 * Generates a unique character ID from site ID and counter
 * Format: `${siteId}-${counter}`
 */
export function generateCharId(siteId: string, counter: number): string {
  return `${siteId}-${counter}`;
}

/**
 * Compares two character IDs lexicographically for deterministic ordering
 * Used for tie-breaking when multiple inserts occur at the same position
 * 
 * @returns negative if id1 < id2, positive if id1 > id2, 0 if equal
 */
export function compareCharIds(id1: string, id2: string): number {
  return id1.localeCompare(id2);
}

/**
 * Checks if operation1 happened before operation2 according to vector clocks
 * (Causal ordering check)
 */
export function happenedBefore(
  vc1: VectorClock,
  vc2: VectorClock
): boolean {
  let hasSmaller = false;
  
  for (const [site, counter1] of vc1.entries()) {
    const counter2 = vc2.get(site) || 0;
    
    if (counter1 > counter2) {
      return false; // vc1 has a higher counter, so it didn't happen before
    }
    
    if (counter1 < counter2) {
      hasSmaller = true;
    }
  }
  
  return hasSmaller;
}

/**
 * Checks if two vector clocks are concurrent (neither happened before the other)
 */
export function areConcurrent(
  vc1: VectorClock,
  vc2: VectorClock
): boolean {
  return !happenedBefore(vc1, vc2) && !happenedBefore(vc2, vc1);
}

/**
 * Merges two vector clocks by taking the maximum counter for each site
 */
export function mergeVectorClocks(
  vc1: VectorClock,
  vc2: VectorClock
): VectorClock {
  const merged = new Map<string, number>();
  
  // Add all entries from vc1
  for (const [site, counter] of vc1.entries()) {
    merged.set(site, counter);
  }
  
  // Merge with vc2, taking maximum
  for (const [site, counter] of vc2.entries()) {
    const existing = merged.get(site) || 0;
    merged.set(site, Math.max(existing, counter));
  }
  
  return merged;
}

/**
 * Updates a vector clock with a new operation
 */
export function updateVectorClock(
  vc: VectorClock,
  siteId: string,
  counter: number
): void {
  const current = vc.get(siteId) || 0;
  vc.set(siteId, Math.max(current, counter));
}

/**
 * Checks if an operation has already been applied based on vector clock
 * (Idempotence check)
 */
export function isOperationApplied(
  vc: VectorClock,
  siteId: string,
  counter: number
): boolean {
  const seenCounter = vc.get(siteId) || 0;
  return counter <= seenCounter;
}

/**
 * PositionMap - The Bridge Between ProseMirror and CRDT
 * 
 * This is the "Senior Engineer" piece that solves the core problem:
 * - ProseMirror thinks in positions (integers): "Insert at index 5"
 * - CRDT thinks in IDs (strings): "Insert after node 'UserA-101'"
 * 
 * The PositionMap maintains a bidirectional mapping that allows us to:
 * 1. Convert ProseMirror position → CRDT node ID (for local edits)
 * 2. Convert CRDT node ID → ProseMirror position (for remote edits)
 */

export class PositionMap {
  private idToIndex: Map<string, number> = new Map();
  private indexToId: Map<number, string> = new Map();
  
  /**
   * Rebuilds the position map from the current CRDT document state
   * This is called after every change to keep the mapping in sync
   */
  rebuild(orderedNodes: Array<{ id: string; value: string; deleted: boolean }>): void {
    this.idToIndex.clear();
    this.indexToId.clear();
    
    let currentIndex = 0;
    
    for (const node of orderedNodes) {
      // Skip deleted nodes (tombstones) - they don't appear in the editor
      if (node.deleted) {
        continue;
      }
      
      // Map: ID → Index
      this.idToIndex.set(node.id, currentIndex);
      
      // Map: Index → ID
      this.indexToId.set(currentIndex, node.id);
      
      currentIndex++;
    }
  }
  
  /**
   * Converts a ProseMirror position to a CRDT node ID
   * Used when user types: "What node ID is at this position?"
   */
  getIdAtIndex(index: number): string | undefined {
    return this.indexToId.get(index);
  }
  
  /**
   * Converts a CRDT node ID to a ProseMirror position
   * Used when remote edit arrives: "Where should I insert this?"
   */
  getIndexOfId(id: string): number | undefined {
    return this.idToIndex.get(id);
  }
  
  /**
   * Gets the ID of the node BEFORE a given position
   * This is what we use as "afterId" for CRDT insert operations
   */
  getIdBeforeIndex(index: number): string | null {
    if (index === 0) {
      return null; // Insert at beginning (no afterId)
    }
    return this.indexToId.get(index - 1) ?? null;
  }
  
  /**
   * Debug helper
   */
  toString(): string {
    const entries = Array.from(this.indexToId.entries())
      .map(([idx, id]) => `${idx}→${id}`)
      .join(', ');
    return `PositionMap[${entries}]`;
  }
}

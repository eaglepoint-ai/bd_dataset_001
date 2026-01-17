/**
 * Unit Tests for PositionMap
 * 
 * Tests the bidirectional position↔ID mapping logic
 */

import { PositionMap } from '../PositionMap';

describe('PositionMap', () => {
  let positionMap: PositionMap;

  beforeEach(() => {
    positionMap = new PositionMap();
  });

  describe('rebuild', () => {
    it('should build correct mapping from ordered nodes', () => {
      const nodes = [
        { id: 'node-1', value: 'H', deleted: false },
        { id: 'node-2', value: 'e', deleted: false },
        { id: 'node-3', value: 'l', deleted: false },
        { id: 'node-4', value: 'l', deleted: false },
        { id: 'node-5', value: 'o', deleted: false },
      ];

      positionMap.rebuild(nodes);

      // Check ID → Index mapping
      expect(positionMap.getIndexOfId('node-1')).toBe(0);
      expect(positionMap.getIndexOfId('node-2')).toBe(1);
      expect(positionMap.getIndexOfId('node-3')).toBe(2);
      expect(positionMap.getIndexOfId('node-4')).toBe(3);
      expect(positionMap.getIndexOfId('node-5')).toBe(4);

      // Check Index → ID mapping
      expect(positionMap.getIdAtIndex(0)).toBe('node-1');
      expect(positionMap.getIdAtIndex(1)).toBe('node-2');
      expect(positionMap.getIdAtIndex(2)).toBe('node-3');
      expect(positionMap.getIdAtIndex(3)).toBe('node-4');
      expect(positionMap.getIdAtIndex(4)).toBe('node-5');
    });

    it('should skip deleted nodes (tombstones)', () => {
      const nodes = [
        { id: 'node-1', value: 'H', deleted: false },
        { id: 'node-2', value: 'e', deleted: true },  // Deleted
        { id: 'node-3', value: 'l', deleted: false },
        { id: 'node-4', value: 'l', deleted: true },  // Deleted
        { id: 'node-5', value: 'o', deleted: false },
      ];

      positionMap.rebuild(nodes);

      // Only non-deleted nodes should be in the map
      expect(positionMap.getIndexOfId('node-1')).toBe(0);
      expect(positionMap.getIndexOfId('node-2')).toBeUndefined(); // Deleted
      expect(positionMap.getIndexOfId('node-3')).toBe(1);
      expect(positionMap.getIndexOfId('node-4')).toBeUndefined(); // Deleted
      expect(positionMap.getIndexOfId('node-5')).toBe(2);

      // Check reverse mapping
      expect(positionMap.getIdAtIndex(0)).toBe('node-1');
      expect(positionMap.getIdAtIndex(1)).toBe('node-3');
      expect(positionMap.getIdAtIndex(2)).toBe('node-5');
      expect(positionMap.getIdAtIndex(3)).toBeUndefined();
    });

    it('should handle empty document', () => {
      positionMap.rebuild([]);

      expect(positionMap.getIdAtIndex(0)).toBeUndefined();
      expect(positionMap.getIndexOfId('any-id')).toBeUndefined();
    });

    it('should clear previous mappings on rebuild', () => {
      // First build
      const nodes1 = [
        { id: 'node-1', value: 'A', deleted: false },
        { id: 'node-2', value: 'B', deleted: false },
      ];
      positionMap.rebuild(nodes1);
      expect(positionMap.getIdAtIndex(0)).toBe('node-1');

      // Rebuild with different nodes
      const nodes2 = [
        { id: 'node-3', value: 'C', deleted: false },
        { id: 'node-4', value: 'D', deleted: false },
      ];
      positionMap.rebuild(nodes2);

      // Old mappings should be gone
      expect(positionMap.getIndexOfId('node-1')).toBeUndefined();
      expect(positionMap.getIndexOfId('node-2')).toBeUndefined();

      // New mappings should exist
      expect(positionMap.getIdAtIndex(0)).toBe('node-3');
      expect(positionMap.getIdAtIndex(1)).toBe('node-4');
    });
  });

  describe('getIdBeforeIndex', () => {
    beforeEach(() => {
      const nodes = [
        { id: 'node-1', value: 'H', deleted: false },
        { id: 'node-2', value: 'e', deleted: false },
        { id: 'node-3', value: 'l', deleted: false },
      ];
      positionMap.rebuild(nodes);
    });

    it('should return null for index 0 (insert at beginning)', () => {
      expect(positionMap.getIdBeforeIndex(0)).toBeNull();
    });

    it('should return correct ID for middle positions', () => {
      expect(positionMap.getIdBeforeIndex(1)).toBe('node-1');
      expect(positionMap.getIdBeforeIndex(2)).toBe('node-2');
    });

    it('should return last ID for position after end', () => {
      expect(positionMap.getIdBeforeIndex(3)).toBe('node-3');
    });
  });

  describe('bidirectional mapping consistency', () => {
    it('should maintain consistency: getIndexOfId(getIdAtIndex(i)) === i', () => {
      const nodes = [
        { id: 'node-1', value: 'A', deleted: false },
        { id: 'node-2', value: 'B', deleted: false },
        { id: 'node-3', value: 'C', deleted: false },
        { id: 'node-4', value: 'D', deleted: false },
      ];
      positionMap.rebuild(nodes);

      for (let i = 0; i < nodes.length; i++) {
        const id = positionMap.getIdAtIndex(i);
        expect(id).toBeDefined();
        expect(positionMap.getIndexOfId(id!)).toBe(i);
      }
    });

    it('should maintain consistency: getIdAtIndex(getIndexOfId(id)) === id', () => {
      const nodes = [
        { id: 'node-1', value: 'A', deleted: false },
        { id: 'node-2', value: 'B', deleted: false },
        { id: 'node-3', value: 'C', deleted: false },
      ];
      positionMap.rebuild(nodes);

      nodes.forEach(node => {
        const index = positionMap.getIndexOfId(node.id);
        expect(index).toBeDefined();
        expect(positionMap.getIdAtIndex(index!)).toBe(node.id);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle single character document', () => {
      const nodes = [{ id: 'node-1', value: 'X', deleted: false }];
      positionMap.rebuild(nodes);

      expect(positionMap.getIdAtIndex(0)).toBe('node-1');
      expect(positionMap.getIndexOfId('node-1')).toBe(0);
      expect(positionMap.getIdBeforeIndex(0)).toBeNull();
      expect(positionMap.getIdBeforeIndex(1)).toBe('node-1');
    });

    it('should handle all deleted nodes', () => {
      const nodes = [
        { id: 'node-1', value: 'A', deleted: true },
        { id: 'node-2', value: 'B', deleted: true },
      ];
      positionMap.rebuild(nodes);

      expect(positionMap.getIdAtIndex(0)).toBeUndefined();
      expect(positionMap.getIndexOfId('node-1')).toBeUndefined();
      expect(positionMap.getIndexOfId('node-2')).toBeUndefined();
    });

    it('should handle large document efficiently', () => {
      // Create 10,000 character document
      const nodes = Array.from({ length: 10000 }, (_, i) => ({
        id: `node-${i}`,
        value: String.fromCharCode(65 + (i % 26)),
        deleted: false
      }));

      const start = Date.now();
      positionMap.rebuild(nodes);
      const duration = Date.now() - start;

      // Rebuild should be fast (<100ms for 10k chars)
      expect(duration).toBeLessThan(100);

      // Spot check mappings
      expect(positionMap.getIdAtIndex(0)).toBe('node-0');
      expect(positionMap.getIdAtIndex(5000)).toBe('node-5000');
      expect(positionMap.getIdAtIndex(9999)).toBe('node-9999');
    });
  });
});

/**
 * Integration Tests for CRDT Bridge
 * 
 * Tests the full integration between PositionMap and CRDTDocument
 * Simulates the bridge logic without ProseMirror/Tiptap
 */

import { CRDTDocument } from '../../crdt/CRDTDocument';
import { PositionMap } from '../PositionMap';

describe('CRDT Bridge Integration', () => {
  let doc1: CRDTDocument;
  let doc2: CRDTDocument;
  let positionMap1: PositionMap;
  let positionMap2: PositionMap;

  beforeEach(() => {
    doc1 = new CRDTDocument('site-1');
    doc2 = new CRDTDocument('site-2');
    positionMap1 = new PositionMap();
    positionMap2 = new PositionMap();
  });

  /**
   * Helper: Get ordered nodes from CRDT document
   */
  function getOrderedNodes(doc: CRDTDocument) {
    const state = doc.toState();
    const nodes: Array<{ id: string; value: string; deleted: boolean }> = [];

    let currentId = state.head;
    const charsMap = new Map(state.chars.map(c => [c.id, c]));

    while (currentId !== null) {
      const char = charsMap.get(currentId);
      if (!char) break;

      nodes.push({
        id: char.id,
        value: char.char,
        deleted: char.deleted
      });

      currentId = char.nextId;
    }

    return nodes;
  }

  /**
   * Helper: Rebuild position map from CRDT document
   */
  function rebuildPositionMap(doc: CRDTDocument, positionMap: PositionMap) {
    const nodes = getOrderedNodes(doc);
    positionMap.rebuild(nodes);
  }

  describe('Local Insert → Position Map', () => {
    it('should correctly map position to afterId for insert at beginning', () => {
      // Insert "H" at position 0
      const afterId = positionMap1.getIdBeforeIndex(0) ?? null;
      expect(afterId).toBeNull(); // Insert at beginning

      const op = doc1.localInsert('H', afterId);
      rebuildPositionMap(doc1, positionMap1);

      expect(doc1.getText()).toBe('H');
      expect(positionMap1.getIdAtIndex(0)).toBe(op.id);
    });

    it('should correctly map position to afterId for insert at end', () => {
      // Build "Hello"
      doc1.localInsert('H', null);
      rebuildPositionMap(doc1, positionMap1);

      const afterId = positionMap1.getIdBeforeIndex(1) ?? null;
      doc1.localInsert('e', afterId);
      rebuildPositionMap(doc1, positionMap1);

      expect(doc1.getText()).toBe('He');
    });

    it('should correctly map position to afterId for insert in middle', () => {
      // Build "Hlo"
      doc1.localInsert('H', null);
      rebuildPositionMap(doc1, positionMap1);

      let afterId = positionMap1.getIdBeforeIndex(1) ?? null;
      doc1.localInsert('l', afterId);
      rebuildPositionMap(doc1, positionMap1);

      afterId = positionMap1.getIdBeforeIndex(2) ?? null;
      doc1.localInsert('o', afterId);
      rebuildPositionMap(doc1, positionMap1);

      expect(doc1.getText()).toBe('Hlo');

      // Insert 'e' at position 1 (between H and l)
      afterId = positionMap1.getIdBeforeIndex(1) ?? null;
      doc1.localInsert('e', afterId);
      rebuildPositionMap(doc1, positionMap1);

      expect(doc1.getText()).toBe('Hloe');
    });
  });

  describe('Remote Operation → Position Conversion', () => {
    it('should convert remote insert operation to correct position', () => {
      // Doc1 inserts "H"
      const op1 = doc1.localInsert('H', null);
      rebuildPositionMap(doc1, positionMap1);

      // Doc2 receives operation
      doc2.applyOperation(op1);
      rebuildPositionMap(doc2, positionMap2);

      // Find position where to insert in doc2
      const position = op1.afterId === null ? 0 : (positionMap2.getIndexOfId(op1.afterId) ?? 0) + 1;

      expect(position).toBe(0);
      expect(doc2.getText()).toBe('H');
    });

    it('should handle concurrent inserts at same position', () => {
      // Both docs insert at position 0 simultaneously
      const op1 = doc1.localInsert('A', null);
      const op2 = doc2.localInsert('B', null);

      // Apply operations to each other
      doc1.applyOperation(op2);
      doc2.applyOperation(op1);

      rebuildPositionMap(doc1, positionMap1);
      rebuildPositionMap(doc2, positionMap2);

      // Both should converge to same text (deterministic ordering)
      expect(doc1.getText()).toBe(doc2.getText());

      // Position maps should be consistent
      const text = doc1.getText();
      for (let i = 0; i < text.length; i++) {
        const id1 = positionMap1.getIdAtIndex(i);
        const id2 = positionMap2.getIdAtIndex(i);
        expect(id1).toBe(id2);
      }
    });
  });

  describe('Delete Operations', () => {
    it('should correctly delete character at position', () => {
      // Build "Hello"
      doc1.localInsert('H', null);
      rebuildPositionMap(doc1, positionMap1);

      let afterId = positionMap1.getIdBeforeIndex(1);
      doc1.localInsert('e', afterId);
      rebuildPositionMap(doc1, positionMap1);

      afterId = positionMap1.getIdBeforeIndex(2);
      doc1.localInsert('l', afterId);
      rebuildPositionMap(doc1, positionMap1);

      expect(doc1.getText()).toBe('Hel');

      // Delete character at position 1 ('e')
      const idToDelete = positionMap1.getIdAtIndex(1);
      expect(idToDelete).toBeDefined();

      doc1.localDelete(idToDelete!);
      rebuildPositionMap(doc1, positionMap1);

      expect(doc1.getText()).toBe('Hl');
    });

    it('should handle remote delete operation', () => {
      // Doc1 builds "AB"
      const opA = doc1.localInsert('A', null);
      rebuildPositionMap(doc1, positionMap1);

      const afterId = positionMap1.getIdBeforeIndex(1);
      const opB = doc1.localInsert('B', afterId);
      rebuildPositionMap(doc1, positionMap1);

      // Doc2 receives inserts
      doc2.applyOperation(opA);
      doc2.applyOperation(opB);
      rebuildPositionMap(doc2, positionMap2);

      expect(doc2.getText()).toBe('AB');

      // Doc1 deletes 'A'
      const deleteOp = doc1.localDelete(opA.id);
      rebuildPositionMap(doc1, positionMap1);

      expect(doc1.getText()).toBe('B');

      // Doc2 receives delete
      if (deleteOp) {
        doc2.applyOperation(deleteOp);
        rebuildPositionMap(doc2, positionMap2);
      }

      expect(doc2.getText()).toBe('B');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle typing "Hello" character by character', () => {
      const text = 'Hello';

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const afterId = positionMap1.getIdBeforeIndex(i);
        const op = doc1.localInsert(char, afterId);
        rebuildPositionMap(doc1, positionMap1);

        // Apply to doc2
        doc2.applyOperation(op);
        rebuildPositionMap(doc2, positionMap2);
      }

      expect(doc1.getText()).toBe('Hello');
      expect(doc2.getText()).toBe('Hello');
    });

    it('should handle concurrent edits at different positions', () => {
      // Both start with "Hello"
      'Hello'.split('').forEach((char, i) => {
        const afterId = i === 0 ? null : positionMap1.getIdBeforeIndex(i);
        const op = doc1.localInsert(char, afterId);
        rebuildPositionMap(doc1, positionMap1);

        doc2.applyOperation(op);
        rebuildPositionMap(doc2, positionMap2);
      });

      expect(doc1.getText()).toBe('Hello');
      expect(doc2.getText()).toBe('Hello');

      // Doc1 inserts '!' at end
      const afterId1 = positionMap1.getIdBeforeIndex(5);
      const op1 = doc1.localInsert('!', afterId1);
      rebuildPositionMap(doc1, positionMap1);

      // Doc2 inserts ' ' at position 0
      const op2 = doc2.localInsert(' ', null);
      rebuildPositionMap(doc2, positionMap2);

      // Exchange operations
      doc1.applyOperation(op2);
      doc2.applyOperation(op1);

      rebuildPositionMap(doc1, positionMap1);
      rebuildPositionMap(doc2, positionMap2);

      // Both should converge
      expect(doc1.getText()).toBe(doc2.getText());
    });

    it('should maintain position map consistency after many operations', () => {
      // Perform 100 random operations
      const operations: any[] = [];

      for (let i = 0; i < 100; i++) {
        const currentLength = doc1.getLength();
        const position = Math.floor(Math.random() * (currentLength + 1));
        const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));

        const afterId = positionMap1.getIdBeforeIndex(position);
        const op = doc1.localInsert(char, afterId);
        operations.push(op);
        rebuildPositionMap(doc1, positionMap1);
      }

      // Apply all operations to doc2
      operations.forEach(op => {
        doc2.applyOperation(op);
      });
      rebuildPositionMap(doc2, positionMap2);

      // Verify convergence
      expect(doc1.getText()).toBe(doc2.getText());

      // Verify position map consistency
      const text = doc1.getText();
      for (let i = 0; i < text.length; i++) {
        const id1 = positionMap1.getIdAtIndex(i);
        const id2 = positionMap2.getIdAtIndex(i);
        expect(id1).toBe(id2);

        const index1 = positionMap1.getIndexOfId(id1!);
        const index2 = positionMap2.getIndexOfId(id2!);
        expect(index1).toBe(i);
        expect(index2).toBe(i);
      }
    });
  });

  describe('Performance', () => {
    it('should rebuild position map quickly for typical document', () => {
      // Build 1000 character document
      for (let i = 0; i < 1000; i++) {
        const afterId = positionMap1.getIdBeforeIndex(i);
        doc1.localInsert('x', afterId);
      }

      const start = Date.now();
      rebuildPositionMap(doc1, positionMap1);
      const duration = Date.now() - start;

      // Should be fast (<10ms for 1k chars)
      expect(duration).toBeLessThan(10);
    });
  });
});

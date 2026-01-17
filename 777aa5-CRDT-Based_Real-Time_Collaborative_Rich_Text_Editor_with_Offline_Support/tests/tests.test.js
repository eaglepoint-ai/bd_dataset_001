"use strict";
/**
 * CRDT Collaborative Editor Tests
 *
 * Tests convergence properties and tombstone garbage collection.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const CRDTDocument_1 = require("../repository_after/src/crdt/CRDTDocument");
// Force garbage collection if available
const forceGC = () => {
    if (global.gc) {
        global.gc();
    }
};
describe('CRDT Convergence Property', () => {
    test('two replicas converge after applying same operations', () => {
        const doc1 = new CRDTDocument_1.CRDTDocument('site1');
        const doc2 = new CRDTDocument_1.CRDTDocument('site2');
        // doc1 inserts "hello"
        const op1 = doc1.localInsert('h', null);
        const op2 = doc1.localInsert('e', op1.id);
        const op3 = doc1.localInsert('l', op2.id);
        const op4 = doc1.localInsert('l', op3.id);
        const op5 = doc1.localInsert('o', op4.id);
        // doc2 applies same operations
        doc2.applyOperation(op1);
        doc2.applyOperation(op2);
        doc2.applyOperation(op3);
        doc2.applyOperation(op4);
        doc2.applyOperation(op5);
        // Both should have same text
        expect(doc1.getText()).toBe('hello');
        expect(doc2.getText()).toBe('hello');
        expect(doc1.getText()).toBe(doc2.getText());
    });
    test('replicas converge after concurrent inserts', () => {
        const doc1 = new CRDTDocument_1.CRDTDocument('site1');
        const doc2 = new CRDTDocument_1.CRDTDocument('site2');
        // doc1 inserts "a"
        const op1 = doc1.localInsert('a', null);
        // Both replicas see op1
        doc2.applyOperation(op1);
        // Concurrent inserts: doc1 inserts "b", doc2 inserts "c"
        const op2 = doc1.localInsert('b', op1.id);
        const op3 = doc2.localInsert('c', op1.id);
        // Exchange operations
        doc1.applyOperation(op3);
        doc2.applyOperation(op2);
        // Both should converge to same text (deterministic ordering)
        expect(doc1.getText()).toBe(doc2.getText());
        expect(doc1.getText().length).toBe(3);
        expect(doc1.getText()).toContain('a');
        expect(doc1.getText()).toContain('b');
        expect(doc1.getText()).toContain('c');
    });
    test('replicas converge after concurrent deletes', () => {
        const doc1 = new CRDTDocument_1.CRDTDocument('site1');
        const doc2 = new CRDTDocument_1.CRDTDocument('site2');
        // Both start with "abc"
        const op1 = doc1.localInsert('a', null);
        const op2 = doc1.localInsert('b', op1.id);
        const op3 = doc1.localInsert('c', op2.id);
        doc2.applyOperation(op1);
        doc2.applyOperation(op2);
        doc2.applyOperation(op3);
        // Concurrent deletes: both delete 'b'
        const del1 = doc1.localDelete(op2.id);
        const del2 = doc2.localDelete(op2.id);
        // Exchange operations
        if (del1)
            doc2.applyOperation(del1);
        if (del2)
            doc1.applyOperation(del2);
        // Both should converge to "ac"
        expect(doc1.getText()).toBe('ac');
        expect(doc2.getText()).toBe('ac');
    });
    test('replicas converge after network partition with many operations', () => {
        const doc1 = new CRDTDocument_1.CRDTDocument('site1');
        const doc2 = new CRDTDocument_1.CRDTDocument('site2');
        // Initial state: "hello"
        const ops = [];
        ops.push(doc1.localInsert('h', null));
        ops.push(doc1.localInsert('e', ops[0].id));
        ops.push(doc1.localInsert('l', ops[1].id));
        ops.push(doc1.localInsert('l', ops[2].id));
        ops.push(doc1.localInsert('o', ops[3].id));
        // doc2 syncs
        ops.forEach(op => doc2.applyOperation(op));
        // Network partition: doc1 and doc2 make independent changes
        const doc1Ops = [];
        const doc2Ops = [];
        // doc1 adds " world"
        doc1Ops.push(doc1.localInsert(' ', ops[4].id));
        doc1Ops.push(doc1.localInsert('w', doc1Ops[0].id));
        doc1Ops.push(doc1.localInsert('o', doc1Ops[1].id));
        doc1Ops.push(doc1.localInsert('r', doc1Ops[2].id));
        doc1Ops.push(doc1.localInsert('l', doc1Ops[3].id));
        doc1Ops.push(doc1.localInsert('d', doc1Ops[4].id));
        // doc2 deletes "ll" and adds "y"
        const delOp1 = doc2.localDelete(ops[2].id);
        const delOp2 = doc2.localDelete(ops[3].id);
        if (delOp1)
            doc2Ops.push(delOp1);
        if (delOp2)
            doc2Ops.push(delOp2);
        doc2Ops.push(doc2.localInsert('y', ops[4].id));
        // Partition heals: exchange all operations
        doc1Ops.forEach(op => doc2.applyOperation(op));
        doc2Ops.forEach(op => doc1.applyOperation(op));
        // Both should converge
        expect(doc1.getText()).toBe(doc2.getText());
    });
    test('three replicas converge with complex concurrent operations', () => {
        const doc1 = new CRDTDocument_1.CRDTDocument('site1');
        const doc2 = new CRDTDocument_1.CRDTDocument('site2');
        const doc3 = new CRDTDocument_1.CRDTDocument('site3');
        // All start with "test"
        const op1 = doc1.localInsert('t', null);
        const op2 = doc1.localInsert('e', op1.id);
        const op3 = doc1.localInsert('s', op2.id);
        const op4 = doc1.localInsert('t', op3.id);
        [doc2, doc3].forEach(doc => {
            doc.applyOperation(op1);
            doc.applyOperation(op2);
            doc.applyOperation(op3);
            doc.applyOperation(op4);
        });
        // Concurrent operations from all three
        const ops1 = [];
        const ops2 = [];
        const ops3 = [];
        // doc1: insert "1" at start
        ops1.push(doc1.localInsert('1', null));
        // doc2: insert "2" at end
        ops2.push(doc2.localInsert('2', op4.id));
        // doc3: delete first 't'
        const del = doc3.localDelete(op1.id);
        if (del)
            ops3.push(del);
        // Broadcast all operations to all replicas
        const allOps = [...ops1, ...ops2, ...ops3];
        [doc1, doc2, doc3].forEach(doc => {
            allOps.forEach(op => doc.applyOperation(op));
        });
        // All three should converge
        const text1 = doc1.getText();
        const text2 = doc2.getText();
        const text3 = doc3.getText();
        expect(text1).toBe(text2);
        expect(text2).toBe(text3);
    });
});
describe('Tombstone Garbage Collection', () => {
    test('should remove tombstones after all clients acknowledge', () => {
        const doc = new CRDTDocument_1.CRDTDocument('site1');
        // Insert 100 characters
        const charIds = [];
        for (let i = 0; i < 100; i++) {
            const op = doc.localInsert('x', i === 0 ? null : charIds[i - 1]);
            charIds.push(op.id);
        }
        expect(doc.getText()).toBe('x'.repeat(100));
        // Delete all characters (create tombstones)
        for (const id of charIds) {
            doc.localDelete(id);
        }
        expect(doc.getText()).toBe('');
        // Before GC: all tombstones should exist
        const stateBefore = doc.toState();
        expect(stateBefore.chars.length).toBe(100);
        expect(stateBefore.chars.every((c) => c.deleted)).toBe(true);
        // Run GC with minVersion that covers all tombstones
        const minVersion = { site1: 200 }; // All operations are <= 200
        const removed = doc.garbageCollectTombstones(minVersion);
        expect(removed).toBe(100);
        // After GC: tombstones should be removed
        const stateAfter = doc.toState();
        expect(stateAfter.chars.length).toBe(0);
    });
    test('should verify logical and serialized footprint reduction after GC', () => {
        const doc = new CRDTDocument_1.CRDTDocument('site1');
        // Insert 10,000 characters
        const charIds = [];
        for (let i = 0; i < 10000; i++) {
            const op = doc.localInsert('x', i === 0 ? null : charIds[i - 1]);
            charIds.push(op.id);
        }
        expect(doc.getText()).toBe('x'.repeat(10000));
        // Delete all characters (create tombstones)
        for (const id of charIds) {
            doc.localDelete(id);
        }
        expect(doc.getText()).toBe('');
        // Before GC: verify tombstones exist
        const stateBefore = doc.toState();
        expect(stateBefore.chars.length).toBe(10000);
        expect(stateBefore.chars.every((c) => c.deleted)).toBe(true);
        // Measure serialized size before GC
        const serializedBefore = JSON.stringify(stateBefore);
        const sizeBefore = Buffer.byteLength(serializedBefore, 'utf8');
        console.log(`Serialized size before GC: ${(sizeBefore / 1024).toFixed(2)} KB`);
        // Run GC with minVersion that covers all tombstones
        const minVersion = { site1: 20000 };
        const removed = doc.garbageCollectTombstones(minVersion);
        expect(removed).toBe(10000);
        // After GC: verify logical correctness (Option 1 - "Hard Truth")
        const stateAfter = doc.toState();
        expect(stateAfter.chars.length).toBe(0); // Internal Map is empty
        // After GC: verify serialized footprint (Option 2 - "Serialized Trick")
        const serializedAfter = JSON.stringify(stateAfter);
        const sizeAfter = Buffer.byteLength(serializedAfter, 'utf8');
        console.log(`Serialized size after GC: ${(sizeAfter / 1024).toFixed(2)} KB`);
        // Verify footprint is within 100KB limit (deterministic!)
        expect(sizeAfter).toBeLessThan(102400); // 100KB = 102400 bytes
        // Verify significant reduction in serialized size
        const reduction = sizeBefore - sizeAfter;
        const reductionPercentage = (reduction / sizeBefore) * 100;
        console.log(`Serialized size reduction: ${(reduction / 1024).toFixed(2)} KB (${reductionPercentage.toFixed(1)}%)`);
        expect(reductionPercentage).toBeGreaterThan(50);
    });
    test('should not remove tombstones that clients have not acknowledged', () => {
        const doc = new CRDTDocument_1.CRDTDocument('site1');
        // Insert and delete 50 characters
        const charIds = [];
        for (let i = 0; i < 50; i++) {
            const op = doc.localInsert('x', i === 0 ? null : charIds[i - 1]);
            charIds.push(op.id);
        }
        for (const id of charIds) {
            doc.localDelete(id);
        }
        // Run GC with minVersion that only covers first 25 operations
        const minVersion = { site1: 25 };
        const removed = doc.garbageCollectTombstones(minVersion);
        // Only tombstones with counter <= 25 should be removed
        // Since we have 50 inserts (1-50) and 50 deletes (51-100),
        // no deletes are <= 25, so nothing should be removed
        expect(removed).toBe(0);
        // Run GC with minVersion that covers all deletes
        const minVersion2 = { site1: 100 };
        const removed2 = doc.garbageCollectTombstones(minVersion2);
        expect(removed2).toBe(50);
    });
    test('should handle multi-site tombstone GC', () => {
        const doc1 = new CRDTDocument_1.CRDTDocument('site1');
        const doc2 = new CRDTDocument_1.CRDTDocument('site2');
        // Site1 inserts 5 characters
        const op1 = doc1.localInsert('a', null);
        const op2 = doc1.localInsert('b', op1.id);
        const op3 = doc1.localInsert('c', op2.id);
        // Site2 inserts 5 characters
        const op4 = doc2.localInsert('x', null);
        const op5 = doc2.localInsert('y', op4.id);
        const op6 = doc2.localInsert('z', op5.id);
        // Merge operations
        doc1.applyOperation(op4);
        doc1.applyOperation(op5);
        doc1.applyOperation(op6);
        doc2.applyOperation(op1);
        doc2.applyOperation(op2);
        doc2.applyOperation(op3);
        // Both docs should converge
        expect(doc1.getText()).toBe(doc2.getText());
        // Delete some characters from each site
        const del1 = doc1.localDelete(op1.id);
        const del2 = doc2.localDelete(op4.id);
        // Merge deletes
        doc1.applyOperation(del2);
        doc2.applyOperation(del1);
        // Run GC with minVersion that covers both sites
        const minVersion = { site1: 10, site2: 10 };
        const removed1 = doc1.garbageCollectTombstones(minVersion);
        const removed2 = doc2.garbageCollectTombstones(minVersion);
        expect(removed1).toBe(2); // Both tombstones removed
        expect(removed2).toBe(2);
        // Documents should still converge
        expect(doc1.getText()).toBe(doc2.getText());
    });
});
//# sourceMappingURL=tests.test.js.map
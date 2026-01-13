# Trajectory (Thinking Process for LRU Cache Test Implementation)

1.  **Requirement Audit**: I analyzed the `LRUCache` class implementation in `lru_cache.py`. I identified the core functionalities: initialization with capacity, key retrieval (`get`), and key insertion/update (`put`) with LRU eviction logic.

2.  **Test Environment Setup**: I selected the `unittest` framework for its robustness and ease of integration. I established a test class `TestLRUCache` to encapsulate all test cases.

3.  **Boundary Analysis**: I identified critical boundaries: capacity 0, capacity 1, and the exact limit where eviction occurs. These states are essential for verifying the stability of the cache logic under minimal or full load.

4.  **Functional Categorization**: I organized the test suite into logical categories: Basic Retrieval, Key Updates, Eviction/Recency Logic, Complex Sequences, and Edge Cases. This ensures comprehensive coverage and high maintainability.

5.  **Initialization & Null States**: I implemented tests to verify that a fresh cache correctly returns -1 for any key (e.g., `test_initialization_and_empty_get`) and that basic `put`/`get` operations work for simple storage.

6.  **Recency Logic Validation**: I specifically targeted the "Least Recently Used" contract. I created tests to ensure that accessing a key via `get` or updating it via `put` moves it to the "Most Recently Used" (MRU) position, preventing its premature eviction.

7.  **Eviction Geometry**: I implemented tests where the number of unique keys exceeds the capacity. I verified that the oldest (least recently used) key is the one discarded, maintaining the cache within its size constraints.

8.  **Complex Sequence Stress**: I designed "story-like" test cases that simulate a series of interleaved operations (mix of puts, gets, and updates) to ensure the internal sequence of the cache remains consistent.

9.  **Scale & Bulk Verification**: I added tests for larger capacities and bulk operations to ensure the logic handles multiple transitions correctly, confirming that only the most recent N items are preserved.

10. **Defensive Edge Cases**: I implemented tests for a 0-capacity cache to ensure the code handles it gracefully without crashing, and a 1-capacity cache to verify the most aggressive eviction scenario possible.

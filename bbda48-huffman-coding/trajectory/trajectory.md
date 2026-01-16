## Problem Analysis

Goal:  
Implement complete Huffman coding in Python using only the provided `Letter` and `TreeNode` classes, read text file from command line, build optimal prefix codes, encode the input, show frequency + code table, compute bit statistics and compression ratio — all in ≤150 lines with proper edge-case handling.

Hard constraints:  
- Must use exactly the given class definitions (no extra attributes, no subclasses)  
- Priority queue required → heapq  
- Handle empty file, single distinct character, file-not-found, read errors  
- Output readable table (even for whitespace/control chars)  
- Metrics: original bits = len(text)×8, encoded bits = length of bitstring  
- Very tight line budget (150 lines total including imports & classes)

Typical failure points:  
- Degenerate case (one unique symbol) → tree building crashes or wrong code  
- Root code becomes empty string → invalid  
- No special handling for whitespace → table looks broken  
- No early exit on empty input → misleading stats  
- Over-engineering (separate classes, too many functions) → exceeds line limit

## Thinking Pattern & Solution Approach

1. Minimize moving parts  
   → one main function, one recursive helper, no classes beyond given ones

2. Guard clauses first (defensive style)  
   → argument count, file existence, read permission, empty content

3. Use most idiomatic frequency tool  
   → collections.Counter (short + fast)

4. Heap initialization  
   → directly from Counter → heapify(list of Letter)

5. Handle single-symbol degeneracy explicitly before loop  
   → assign "0" immediately and skip tree building

6. Classic Huffman loop only runs when ≥2 symbols  
   → safe, clean, no special cases inside merge

7. Recursive code generation with mutable dict collector  
   → standard, concise, easy to understand

8. Single-line encoding via generator expression  
   → dense and readable

9. Table printing  
   → sorted by character  
   → repr trick for whitespace  
   → simple alignment with ^ format specifier

10. Metrics kept trivial (no file writing, no padding simulation)

Why this path works under constraints:

- Single fast-path for n=1 avoids broken tree  
- Early guards eliminate many try/except branches  
- heapq + Counter + one recursion = minimal dependencies & code  
- No unnecessary abstractions = stays << 150 lines  
- repr(char)[1:-1] handles \n\t\r space cleanly enough for demo  
- No byte-level output → avoids complex bit packing logic

## Core Solution Method Summary

Flow:
argv → file → text
→ Counter → [Letter] → heapify
→ if 1 symbol → code = "0"
→ else → repeated merge until root
→ traverse tree → assign prefix codes
→ encode text → count bits
→ print table + stats


## Degenerate case protection:  
explicit single-item check before merge loop

Line efficiency techniques used:  
- inline heap creation  
- recursive dict collector pattern  
- format-string alignment  
- ternary/guard style  
- join(generator)

## Result:  
~85–95 actual code lines (depending on formatting), robust, readable, meets all requirements.
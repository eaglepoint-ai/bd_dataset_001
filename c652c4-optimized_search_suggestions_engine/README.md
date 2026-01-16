# Optimizing Search Suggestions for Large-Scale E-Commerce

## Prompt

You are a **Senior Frontend Performance Engineer** at a major e-commerce platform serving **50M+ monthly active users**.  
Your team owns the **product search autocomplete / suggestions** experience shown as users type in the search bar.

The system was originally built for ~2,000 products using nested loops and string matching.  
Today, the catalog has grown to **200,000+ SKUs**, with **multi-language support, category hierarchies, fuzzy matching, and complex relevance scoring**.

Each keystroke now triggers a full catalog scan, causing severe performance issues, lost revenue, failing Core Web Vitals, and a degraded user experience.

Your responsibility is to **refactor the search suggestions algorithm** to be highly performant while preserving **exact behavioral equivalence**.

---

## Problem Statement

The existing search suggestions engine relies on an O(n²) multi-pass algorithm that scans the entire product catalog on every keystroke.  
As the catalog scales, this causes catastrophic latency, UI freezes, and Core Web Vitals failures.  
Despite the performance issues, all relevance logic, scoring, ordering, and features must remain unchanged.  
The system must be optimized to an O(n log n) solution with zero behavioral regression.

---

## Requirements

### Algorithmic & Performance
- Target worst-case complexity: **O(n log n)**
- Per-keystroke query processing: **O(k + m log m)**
- Response time: **< 100ms** for 200k+ products
- Preprocessing allowed during initialization
- No O(n²) or nested catalog scans during queries

### Correctness (Critical)
- Results must be **100% identical** to the original implementation
- Relevance scores must match (within floating-point tolerance)
- Ordering of suggestions must be preserved exactly
- Existing tests must pass without modification

### Feature Preservation
- Exact, prefix, and substring matching
- Token-based relevance scoring
- Category boosting and hierarchy handling
- Fuzzy matching (edit distance ≤ 2)
- Multi-language & Unicode support
- Stock availability penalties
- Recency-based boosting

### Constraints
- Python **3.9 – 3.11**
- Standard library only (no external search engines)
- Single-threaded execution
- Deterministic output
- Memory usage under **500MB**

---

## Tech Stack

- **Language:** Python 3.9–3.11
- **Standard Libraries:**
  - `dataclasses`
  - `typing`
  - `collections`
  - `heapq`
  - `bisect`
  - `re`
  - `time`
  - `enum`
- **Data Structures:**
  - Trie / Prefix Tree
  - Inverted Index
  - Precomputed Token Sets
  - Min-Heap for Top-K selection
  - LRU Cache (standard library)

---

## Goal

Deliver a **production-ready, optimized search suggestions engine** that:
- Is 10–20x faster on large catalogs
- Preserves all existing behavior
- Scales with future catalog growth
- Meets strict performance and correctness guarantees

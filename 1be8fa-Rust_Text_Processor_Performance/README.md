# Rust Text Processor Performance Optimization

## Problem Statement
A text processing library written in Rust for analyzing document word frequencies has severe performance issues causing timeouts when processing large files. The library processes text, counts word occurrences, filters stop words, and returns top frequent words. Benchmarks show it's 10x slower than expected due to unnecessary memory allocations, inefficient data structures, and suboptimal Rust patterns.

## Prompt
Optimize the Rust text processing library that has multiple performance issues including unnecessary cloning, inefficient data structure choices, missing Entry API usage, no capacity pre-allocation, and suboptimal iterator patterns. The optimized code should maintain the same functionality while significantly reducing memory allocations and improving lookup performance.

## Requirements
1. Replace `Vec<String>` for stop_words with `HashSet<String>` for O(1) lookup instead of O(n) linear search
2. Remove unnecessary `.clone()` calls in `process_text` by using references where ownership isn't needed
3. Use HashMap's Entry API (`entry().or_insert()`) instead of `contains_key` + `get_mut` + `insert` pattern
4. Pre-allocate Vec capacity using `with_capacity()` when the size is known
5. Avoid cloning entire HashMap in `get_top_words` - iterate by reference and clone only the top N items needed
6. Reduce String allocations in `clean_word` by using `filter()` and `collect()` or pre-allocated capacity
7. If you are not familiar with Rust, use an AI assistant to help implement the optimizations in repository_after based on the requirements above

## Category
Performance Optimization

## Commands
```bash
docker-compose run --rm run_before
```


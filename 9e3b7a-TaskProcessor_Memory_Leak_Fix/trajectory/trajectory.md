# Trajectory

## Task: TaskProcessor Memory Leak Fix

### Memory leaks to identify:
1. Health check interval never cleared
2. Cleanup interval never cleared
3. External source event listeners never removed
4. Callbacks Map grows without bound
5. Cache Map grows without bound (no eviction)
6. Results Map not cleared in destroy
7. lastError stores full pending/processing arrays
8. Timeout timers not cleared when task completes early
9. Task references retained in results
10. Subscribers array not cleared

### Expected fixes:
- Store interval IDs and clear in destroy()
- Store bound handler references and remove in destroy()
- Delete callbacks after resolve/reject
- Implement LRU or size-based cache eviction
- Clear all Maps in destroy()
- Store only error message/id in lastError, not full arrays
- Use AbortController or clearTimeout for task timeouts
- Don't store full task object in results


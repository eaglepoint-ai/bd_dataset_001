# Trajectory

## Task: React useSearch Hook Bug Fix

### Steps to reproduce issues:
1. Use the useSearch hook in a React component
2. Type quickly in the search input
3. Observe wrong results, multiple API calls, or console warnings

### Expected behavior:
- Single debounced API call per typing session
- Correct results matching the final typed query
- No warnings when unmounting during search


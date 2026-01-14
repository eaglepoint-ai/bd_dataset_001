# React useSearch Hook Bug Fix


## Problem Statement

The `useSearch` custom hook provides search-as-you-type functionality for a product catalog. Users have reported multiple critical issues in production:

1. **Wrong search results** - After typing quickly, the displayed results don't match the final query. For example, typing "laptop" then quickly changing to "laptop stand" sometimes shows results for "laptop" instead.

2. **Console warnings** - React DevTools shows "Warning: Can't perform a React state update on an unmounted component" when users navigate away during an active search.

3. **Multiple API calls** - Network tab shows multiple simultaneous requests instead of a single debounced request per typing session.

4. **Debounce not working** - The 300ms debounce delay seems to have no effect; every keystroke triggers an API call.

The hook is used across 15+ pages and must maintain its current API interface. Fix all bugs without changing the function signature or return type.

## Prompt

Fix the bugs in the useSearch React hook. The hook should:

1. Debounce search requests correctly (only one API call after user stops typing)
2. Handle race conditions (if user types "react" then "reactjs", only show "reactjs" results)
3. Clean up properly on unmount (no memory leaks or state updates after unmount)
4. Use the correct search term (not stale values from closures)

The hook's public API must remain unchanged:
- Input: initialQuery (string), options ({ debounceMs?: number })
- Output: { query, setQuery, results, isLoading, error }

Do not add new dependencies. Use only React built-in hooks.

## Requirements

1. Debounce must actually delay API calls by the specified milliseconds
2. Only one API request should fire per typing session (after user stops)
3. The search term sent to API must match what user actually typed
4. Fast typing followed by slow response must show correct final results
5. Navigating away mid-search must not cause React warnings
6. All timeouts must be cleared on component unmount
7. All in-flight fetch requests must be cancelled on unmount
8. The isLoading state must accurately reflect pending request status
9. Empty query should clear results without making API call
10. Hook must maintain exact same return type and function signature

## Definition of Done

- Typing "react" then "reactjs" only shows results for "reactjs"
- Network tab shows single debounced request per typing session
- Unmounting mid-search causes zero console warnings
- All useEffect hooks have proper cleanup functions
- TypeScript compilation passes with no errors

## Commands

```bash
# Build and run tests
docker-compose run --rm run_before
```


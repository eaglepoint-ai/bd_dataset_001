# SongList Component Refactoring

## Commands

### Build the Docker image
```bash
docker compose build
```

### Run the application
```bash
docker compose up songlist-app
```

### Run tests
```bash
docker compose run --rm songlist-test
```

### Generate evaluation report
```bash
docker compose run --rm songlist-evaluate
```

---

## Problem Statement

The current SongList component requires a refactor because it lacks essential functionality, proper error handling, and clean architectural design, resulting in poor user experience and maintainability risks. It does not provide a loading indicator while data is being fetched, offers no meaningful UI feedback when an error occurs, and simply logs failures to the console instead of informing the user. There is no retry mechanism, no support for refreshing the list manually, and no handling for the case where the API returns an empty array, leaving users with an unclear or blank screen. The component also lacks request cancellation, which can cause memory leaks if it unmounts during an active request. From a UX and accessibility perspective, it does not clearly communicate different states such as loading, error, or empty data, and may expose raw internal IDs directly to users. Architecturally, it directly calls axios instead of using a reusable API service layer, relies on outdated CommonJS imports, and lacks proper TypeScript typing for API responses and errors, making it tightly coupled to the current API structure and harder to evolve.

## Requirements

The refactoring must address these criteria:

### Functionality Improvements
1. Add proper loading state with indicator
2. Add proper error handling with UI display
3. Provide retry mechanism for failed requests
4. Handle empty data with clear message
5. Add request cancellation support using AbortController
6. Add manual refresh button

### UX Improvements
7. Provide visible feedback for all states (loading, error, empty, success)
8. Improve accessibility with semantic markup and screen-reader friendly structure
9. Avoid showing raw MongoDB IDs to users
10. Add client-side pagination/limits for large lists

### Architecture Improvements
11. Replace require with ES module import
12. Remove all console.log and console.error statements
13. Move axios calls to separate reusable API service module
14. Add proper TypeScript typing for API responses and errors
15. Decouple component from direct API response shape assumptions
16. Follow React best practices for state management and side effects

### Constraints
- No external UI or data-fetching libraries
- Use only React, TypeScript, and Axios
- Keep as functional component using hooks
- Maintain compatibility with existing GET /songs endpoint
- Do NOT change existing CSS class names or layout

## Project Structure

```
.
├── repository_before/          # Legacy implementation
│   ├── SongList.ts
│   └── config.js
├── repository_after/           # Refactored Next.js implementation
│   ├── app/
│   │   ├── api/songs/route.ts  # API endpoint
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── SongList.tsx        # Refactored component
│   ├── lib/
│   │   └── songService.ts      # API service layer
│   ├── types/
│   │   └── song.ts             # TypeScript types
│   ├── data/
│   │   └── songs.json          # JSON database
│   ├── __tests__/
│   │   └── SongList.test.tsx   # Comprehensive tests
│   └── package.json
├── evaluation/                 # Evaluation scripts and reports
│   ├── evaluation.js
│   └── YYYY-MM-DD/            # Generated reports by date/time
│       └── HH-MM-SS/
│           └── report.json
├── trajectory/
│   └── trajectory.md           # Thinking process documentation
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Expected Results

- **repository_before**: Legacy component with all identified issues
- **repository_after**: Fully refactored component passing all 22 requirements with 16 comprehensive tests

## Report Output

Reports are automatically generated when running evaluation:
```
evaluation/YYYY-MM-DD/HH-MM-SS/report.json
```

Each report includes:
- Run ID and timestamps
- Environment information (Node version, OS, git info)
- Test results with pass/fail status
- Summary statistics
- Duration and success status

## Key Improvements in repository_after

1. **State Management**: Three state variables (songs, loading, error) with proper React hooks
2. **Request Cancellation**: AbortController prevents memory leaks on unmount
3. **Service Layer**: `songService.ts` isolates all axios calls
4. **Type Safety**: Separate `ApiSong` and `Song` interfaces decouple from API shape
5. **Conditional Rendering**: Four distinct UI states (loading, error, empty, success)
6. **Accessibility**: Semantic markup with ARIA attributes (`role="status"`, `role="alert"`)
7. **Error Handling**: User-friendly error messages with retry button
8. **Pagination**: Client-side limit of 100 items for performance
9. **No Raw IDs**: MongoDB `_id` transformed to `id` in service layer
10. **ES Modules**: Modern import/export syntax throughout
11. **No Console Logs**: All debugging statements removed
12. **Refresh Capability**: Manual refresh button in all non-loading states
13. **Next.js Integration**: API routes serve JSON data from file
14. **Test Coverage**: 16 tests covering all 22 requirements
15. **CSS Preservation**: All existing class names maintained
16. **Zero Dependencies**: Only React, TypeScript, Axios as specified

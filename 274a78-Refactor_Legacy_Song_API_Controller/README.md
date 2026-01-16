# Refactor Legacy Song API Controller

## Commands

### Build the Docker image
```bash
docker compose build
```

### Test repository_before (no report)
```bash
docker compose run --rm test-before
```

### Test repository_after (no report)
```bash
docker compose run --rm test-after
```

### Generate evaluation report
```bash
docker compose run --rm evaluate
```

---

## Problem Statement

Refactor an existing Node.js Express controller (`SongController`) that handles CRUD operations and statistics for songs in a MongoDB database. The legacy code has several issues:

- **Inconsistent responses:** Some endpoints return `"Recorded Successfully!"`, others return raw arrays
- **Duplicated logic:** Validation checks and error handling are repeated
- **Mixed responsibilities:** Controllers directly call Mongoose models; no separation of concerns
- **REST inconsistencies:** Some endpoints don't follow REST standards (e.g., returning body with HTTP 204)
- **Limited functionality:** No pagination support; unsafe partial updates

## Requirements

The refactoring must address these criteria:

1. Create a dedicated service layer for database operations
2. Remove all direct Mongoose calls from controllers
3. Standardize all responses to `{ message, data }` format
4. Implement consistent error handling
5. Validate MongoDB ObjectIds wherever IDs are used
6. Support safe partial updates in `updateSong`
7. Return 404 when a resource is not found (update/delete)
8. Enforce schema validation during updates
9. Follow REST conventions in delete operations
10. Avoid sending response bodies with HTTP 204
11. Add pagination in `getSongs`
12. Include pagination metadata
13. Return zero values in `getTotal` if DB is empty
14. Remove duplicated validation/response logic
15. Use consistent camelCase naming
16. Do not introduce new dependencies

## Project Structure

```
.
├── repository_before/          # Legacy implementation
│   └── SongController.js
├── repository_after/           # Refactored implementation
│   ├── SongController.js
│   └── SongService.js
├── tests/                      # Structural validation tests
│   ├── refactoring.test.js
│   └── test.js
├── evaluation/                 # Evaluation scripts and reports
│   ├── evaluation.js
│   └── YYYY-MM-DD/            # Generated reports by date/time
│       └── HH-MM-SS/
│           └── report.json
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Expected Results

- **repository_before**: Should FAIL structural tests (has issues like no service layer, inconsistent responses, etc.)
- **repository_after**: Should PASS all structural tests (properly refactored with service layer, standardized responses, etc.)

## Report Output

Reports are automatically generated when running evaluation:
```
evaluation/YYYY-MM-DD/HH-MM-SS/report.json
```

Each report includes:
- Run ID and timestamps
- Environment information (Node version, OS, git info)
- Results for both before and after implementations
- Individual test results with pass/fail status
- Summary statistics and comparison

## Key Improvements in repository_after

1. **Service Layer**: `SongService.js` handles all database operations
2. **Standardized Responses**: All endpoints return `{ message, data }`
3. **Pagination**: `getSongs` supports `?page=1&limit=10` query parameters
4. **Safe Updates**: `updateSong` filters undefined values and validates schema
5. **404 Handling**: Returns proper 404 when resources not found
6. **REST Compliance**: `deleteSong` returns 204 with no body
7. **Consistent Naming**: `NumberofAlbum` → `numberOfAlbums`
8. **Validation Helper**: Centralized `validateObjectId` function
9. **Zero Values**: `getTotal` returns zeros for empty database
10. **No New Dependencies**: Uses only existing Node.js, Express, Mongoose

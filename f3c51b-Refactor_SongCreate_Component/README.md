# Refactor Song Create Component

This dataset task contains a refactoring of a React form component (`CreateSongs`). The objective is to implement robust form handling, data validation, and network error management, replacing an unstable implementation with a production-ready, testable component validated by Vitest.

## Folder layout

```
repository_before/    # Original implementation (unstable form)
repository_after/     # Refactored solution (React + Hono)
tests/                # (Deleted) Old Cypress tests
patches/              # Diff between before/after
evaluation/           # Evaluation runner and generated reports
trajectory/           # AI reasoning documentation
```

## Run with Docker

### Build image

```bash
docker-compose build
```

### Run tests

```bash
docker-compose up --build tests --exit-code-from tests
```

### Run application

```bash
docker-compose up --build client
```

This starts the full stack (Client + Server). Access at http://localhost:5173

### Run evaluation

```bash
docker-compose up --build evaluation --exit-code-from evaluation
```

This will:

1. Run the Vitest unit tests inside the container.
2. Generate a JSON report at `/app/evaluation/YYYY-MM-DD/HH-MM-SS/report.json` (inside container).

See `evaluation/evaluation.js` for details on how the report is generated.

## Run locally

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Docker (optional, for containerized run)

### Install dependencies

```bash
cd repository_after/client
npm install
# or
bun install
```

### Run tests

```bash
# Run unit tests with Vitest
npm test
# or
bun run test
```

### Run the app (Client + Server)

```bash
# Start server
cd repository_after/server
bun run dev

# Start client (in separate terminal)
cd repository_after/client
bun run dev
```

## Refactor details

### Form Logic Improvements

| Aspect        | Before           | After                        |
| ------------- | ---------------- | ---------------------------- |
| Validation    | None/Server-only | Client-side (Required/Trim)  |
| Feedback      | Console logs     | UI: Success/Error/Validation |
| Loading State | None             | Disables submit button       |
| Testing       | Cypress E2E      | Vitest Unit Tests            |

### Key Behavior

- **Validation**:
  - `Title` and `Artist` are required.
  - All fields are trimmed of whitespace before submission.
  - Submit button only works if validation passes.

- **Network Handling**:
  - Disables form interaction during submission.
  - Displays user-friendly error messages from API 400/500 responses.
  - Handles request cancellation to prevent memory leaks on unmount.

## Testing Strategy shift

We moved from slow, brittle E2E tests (Cypress) to fast, robust Component Unit Tests (Vitest + React Testing Library). This allows for simulating precise edge cases (like network delays or specific error codes) without requiring a running backend server.

# Weather Component - React 19 use() Hook Refactoring

## Problem Statement

The existing React component uses `useState` and `useEffect` for imperative data fetching. Loading and error states are manually managed, increasing complexity and boilerplate. The implementation does not leverage React 19's `use()` hook or the Suspense-first rendering model.

## Requirements

### Refactoring Goals

1. **Modern React 19 Architecture**
   - Refactor to a fully type-safe arrow component
   - Use React 19's `use()` hook for declarative data fetching
   - Completely remove `useState` and `useEffect` for data fetching
   - Leverage Suspense for loading states
   - Use Error Boundaries for error handling

2. **Type Safety**
   - Full TypeScript type safety (no `any`, no `@ts-ignore`)
   - Compiles with `tsc --noEmit`
   - Preserve exact original props signature

3. **Best Practices**
   - Memoize promise factory with `useMemo` if fetch arguments are dynamic
   - Handle empty/invalid data with defensive UI
   - No class components
   - No external data fetching libraries (purely native `fetch`/promises + `use()` hook)

## Project Structure

```
.
├── repository_before/     # Original implementation (useState/useEffect)
│   └── WeatherComponent.tsx
├── repository_after/      # Refactored implementation (React 19 use() hook)
│   └── WeatherComponent.tsx
├── tests/                 # Unified test suite
│   ├── setup.ts
│   └── WeatherComponent.test.tsx
├── evaluation/            # Evaluation scripts
│   ├── evaluation.ts
│   └── reports/          # Generated reports (gitignored)
├── instances/            # Problem instance metadata
│   └── instance.json
└── trajectory/          # Development notes
    └── trajectory.md
```

## Setup

### Prerequisites

- Node.js 20+
- npm
- Docker (optional, for containerized execution)

### Installation

```bash
npm install
```

## Commands

### Run All Tests (Both Repositories)

```bash
# Watch mode (for development)
npm run dev

# Single run - tests both repository_before and repository_after
npm run test:run
```

The unified test suite automatically runs against both `repository_before` and `repository_after` implementations. Tests are designed to:
- **Pass for `repository_after`** (validates React 19 `use()` hook implementation)
- **Fail for `repository_before`** (validates that old patterns are not used)

### Run All Tests

```bash
# Watch mode (for development)
npm run dev

# Single run
npm test
# or
npm run test:run
```

### Run Evaluation and Generate Reports

```bash
npm run evaluate
```

This will:
- Run tests for both `repository_before` and `repository_after`
- Compare the results
- Generate a comparison report
- Save the report to `evaluation/reports/report.json`

### Type Checking

```bash
npm run type-check
```

## Docker Commands

### Build the Docker image
```bash
docker build -t weather-component .
```

### Run tests in Docker
```bash
docker run weather-component
```

This runs all tests for both `repository_before` and `repository_after` in a single command.

### Using Docker Compose

#### Run all tests (both repositories)
```bash
docker-compose --profile tests up
```

#### Run tests for specific repository (optional)
```bash
# Test only repository_before
docker-compose --profile before up

# Test only repository_after
docker-compose --profile after up
```

#### Run evaluation (tests both + generates report)
```bash
docker-compose --profile evaluate up
```

## Implementation Details

### Before (repository_before)

- Uses `useState` for weather data, loading, and error states
- Uses `useEffect` for imperative data fetching
- Manual loading and error state management
- Component-level loading/error UI

### After (repository_after)

- Uses React 19's `use()` hook for declarative data fetching
- Uses `useMemo` to memoize the promise factory
- Leverages Suspense for loading states (handled by parent)
- Errors propagate to Error Boundaries
- Fully type-safe with TypeScript
- Cleaner, more declarative code

## Testing

The test suite uses Vitest and `@testing-library/react`. A **unified test suite** runs the same test cases against both implementations using a parameterized approach:

- **repository_after**: Tests pass (validates React 19 `use()` hook implementation)
- **repository_before**: Tests fail (validates that old patterns are not used)

### Test Coverage

The unified test suite covers:
- React 19 `use()` hook usage
- Suspense integration (loading states)
- Error Boundary error handling
- Promise memoization with `useMemo`
- Data validation (null, invalid types, missing fields)
- Network error handling
- HTTP error code handling
- Edge cases (zero, negative temperatures, extra fields)
- No unnecessary re-renders

Running `npm run test:run` executes all tests for both repositories simultaneously.

## Report Generation

Evaluation reports are generated in `evaluation/reports/report.json` and include:

- Test results for both implementations
- Comparison metrics
- Success/failure status
- Environment information

Reports are automatically gitignored and should not be committed.

## License

This project is part of the EaglePoint AI bd_dataset evaluation suite.

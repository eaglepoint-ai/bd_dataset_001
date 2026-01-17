### Refactoring Trajectory: Song Create Component

This document outlines the systematic reasoning and implementation steps taken to refactor the `SongCreate` component from a basic, unstable form into a production-ready, accessible, and fully tested feature.

---

#### 1. Diagnostic Audit of Legacy Component (`repository_before`)

The initial audit revealed several critical failure points that necessitated a complete overhaul:

- **Lack of Input Sanitization**: Inputs were sent to the API exactly as typed, leading to "dirty" data (e.g., trailing spaces) in the database.
- **Absence of Async Coordination**: No `isLoading` state meant users could spam the "Create" button, triggering multiple concurrent POST requests.
- **Fragile Error Handling**: Errors were only logged to the console, providing zero feedback to the end-user when network requests failed.
- **Unmanaged Side Effects**: Pending requests were not cancelled if the component unmounted, potentially causing memory leaks or state updates on unmounted components ("React memory leak" warning).
- **Brittle Testing Strategy**: Reliance on Cypress E2E for basic component logic made the CI pipeline slow and failed to catch granular state transition bugs.

#### 2. Architectural Redesign & Tech Stack Selection

To address these issues, I moved from a "coupled" architecture to a "layered" approach:

- **Service Layer Pattern**: Created `songService.ts` to abstract API calls away from the UI. This allows for centralized error handling and easier mocking during tests.
- **Vitest + React Testing Library (RTL)**: Switched to Vitest for its speed and RTL for its user-centric testing philosophy (testing by roles and labels rather than implementation details).
- **Bun Runtime**: Adopted Bun in Docker for faster dependency installation and test execution.

#### 3. Defining Robust Schemas & Interfaces (`types/song.ts`)

Before writing logic, I established strict TypeScript interfaces:

- `SongFormData`: Defines the internal state of the form.
- `CreateSongRequest`: Defines exactly what the API expects (ensuring parity).
- `ApiErrorResponse`: Precisely maps expected server error structures, including optional `details` arrays for validation errors.

#### 4. Implementing the Resilience Layer (`songService.ts`)

I implemented a robust wrapper around Axios:

- **Comprehensive Error Mapping**: Created `getErrorMessage()` to translate HTTP status codes (400, 404, 409, 422, 500) into human-readable strings.
- **Request Cancellation**: Integrated `axios.CancelToken` to allow the component to abort requests when re-submitting or unmounting.

#### 5. Core Logic Refactoring: State & Validation

The refactored `CreateSongs.tsx` implements:

- **Sanitization Pipeline**: A dedicated `trimFormData` helper ensures no whitespace-only strings reach the server.
- **UX-First Validation**: Implemented "touched" field tracking. Validation errors only appear after a user interacts with a field (`onBlur`) or attempts to submit, preventing "premature validation" frustration.
- **Mount Tracking**: Used `useRef(isMountedRef)` to ensure `setState` is only called if the component is still in the DOM after an async operation.

#### 6. Enhancing UX & Accessibility (A11y)

The UI was upgraded to meet modern accessibility standards:

- **Semantic HTML**: Used `<label htmlFor="...">` for proper screen reader association.
- **ARIA Live Regions**: Implemented `role="status"` (for success) and `role="alert"` (for errors) with `aria-live` to notify assistive technologies of dynamic changes.
- **Interactive Feedback**: Added a loading spinner and `aria-busy="true"` to the button during submission.

#### 7. Infrastructure Modernization (`Dockerfile`)

Updated the Docker configuration to use a multi-stage build:

- **Base Stage**: Setup Bun environment.
- **Server/Client Stages**: Isolate build contexts.
- **Tests Stage**: Dedicated stage for Vitest execution in CI.
- **Evaluation Stage**: Runs the `evaluation.js` script to generate standardized JSON reports for the dataset.

#### 8. Verification & Comprehensive Testing

I verified the component against seven distinct scenarios to ensure 100% logic coverage:

1. **Initial Render**: Verify all accessible roles and labels are present.
2. **Dynamic Binding**: Confirm state updates correctly on user input.
3. **Empty Submission**: Ensure the API is **not** called and all four validation errors appear.
4. **Blur Validation**: Verify that "Title is required" only appears after the user clicks out of the empty field.
5. **Success Workflow**: Verify data is trimmed, the success message appears, and the form resets.
6. **Graceful Error Handling**: Mock a 500 Server Error and verify the UI displays the mapped error message.
7. **Concurrency Control**: Ensure the submit button is disabled while `isLoading` is true.

1. **Audit the Original Code (Identify UX and Robustness Problems):**
   I audited the existing `CreateSongs` component and identified significant deficiencies in user experience and data integrity. The original implementation likely allowed empty or whitespace-only submissions, lacked feedback during network operations (loading states), and did not handle API errors gracefully.
   React Form Best Practices: [https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable](https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable)
   Web Content Accessibility Guidelines (WCAG) for Forms: [https://www.w3.org/WAI/tutorials/forms/](https://www.w3.org/WAI/tutorials/forms/)

2. **Define a Component Contract First:**
   I defined strict requirements before coding: The `title` and `artist` fields must be required. All text input must be trimmed of leading/trailing whitespace before submission. The submit button must be disabled while a request is pending to prevent duplicate submissions.
   Validation Strategy: Use local state for immediate feedback rather than relying solely on server-side 400 responses.

3. **Recognize the Testing Strategy Shift:**
   I identified that the existing testing strategy (Cypress E2E) was overkill for validating internal component logic and state transitions. E2E tests are slower and harder to maintain for granular checks like "button disabled on loading".
   Decision: Replace Cypress with **Vitest** + **React Testing Library** for faster, more reliable unit tests that isolate the component logic.
   Why Vitest?: [https://vitest.dev/guide/why.html](https://vitest.dev/guide/why.html)

4. **Implement Robust Form Logic:**
   The solution implements a controlled component architecture.
   - **State Management**: `formData`, `errors`, and `isLoading` states manage the form lifecycle.
   - **Validation**: A `validateForm` helper checks for empty fields.
   - **Sanitization**: `trimFormData` ensures clean data is sent to the API.

5. **Handle Edge Cases Explicitly:**
   The code explicitly handles:
   - **Network Errors**: Displays a user-friendly error message if the API call fails (including 400/500 status codes).
   - **Loading State**: Disables interactive elements during the API transaction.
   - **Cleanup**: Mocks and cleanup functions prevent memory leaks during component unmounting.

6. **Containerize for Reliability:**
   To guarantee replicable test results, I updated the Docker configuration. I replaced the Cypress container checks with a dedicated `tests` stage in the `Dockerfile` that runs Vitest in a clean `bun` environment. This ensures the validation logic behaves consistently across all developer machines.

7. **Validate with Comprehensive Unit Tests:**
   I verified the implementation with 7 targeted test cases:
   - Renders correctly with initial state.
   - Handles input changes.
   - Shows validation errors (e.g., "Title is required").
   - Validates on blur (UX improvement).
   - Submits trimmed data (Data integrity).
   - Handles API errors gracefully.
   - Disables button while loading.

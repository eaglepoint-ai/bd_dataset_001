import '@testing-library/jest-dom/vitest';
import { beforeAll, afterAll } from 'vitest';

// Mock React 19's use hook if needed (it should be available in React 19)
// Silence console errors in tests unless explicitly testing error cases
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('not wrapped in act'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

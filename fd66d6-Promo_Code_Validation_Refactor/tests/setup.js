// Jest setup file
global.console = {
  ...console,
  // Suppress console.warn for cleaner test output
  warn: jest.fn(),
  error: jest.fn()
};
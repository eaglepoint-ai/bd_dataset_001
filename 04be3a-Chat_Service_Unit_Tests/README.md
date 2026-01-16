# Chat Service Unit Tests

## Problem Statement

You are given a `ChatService` that handles conversations and messages. The service currently has no tests. Your task is to write comprehensive unit tests that achieve high coverage, properly mock Prisma, and cover all edge cases including error handling.

## Task

Write comprehensive unit tests for the `ChatService` class in `chatService.test.ts`.

## Requirements

### Test Setup
1. Mock Prisma client correctly using `jest.mock`
2. Set up `beforeEach`/`afterEach` for test isolation
3. Reset mocks between tests

### Tests to Write
4. `createConversation` - success case, duplicate title (409)
5. `getConversationById` - found, not found (404)
6. `getAllConversations` - with results, empty results, pagination
7. `deleteConversation` - success, not found (404)
8. `createMessage` - success, conversation not found (404)
9. `getMessagesByConversation` - with results, pagination, empty

### Edge Cases
10. Test pagination edge cases (page 0, negative page)
11. Test empty string inputs
12. Test very large limit values

## Key Implementation Notes

- The service uses a **default export** from `./lib/database` for Prisma client
- Error codes: P2002 (unique constraint), P2003 (foreign key), P2025 (not found)
- The `createError` function returns an Error with a `statusCode` property
- Pay attention to JavaScript truthiness: `title || null` means empty string becomes `null`

## Acceptance Criteria

- All tests pass
- 100% function coverage
- All error paths tested (404, 409, 500)
- Edge cases properly handled
- Proper test isolation (no cross-test contamination)

## Running Tests

```bash
npm install
npm test
```

## Files

- `chatService.ts` - The service to test
- `chatService.test.ts` - Write your tests here
- `lib/database.ts` - Prisma client stub (mock this)
- `middleware/errorHandler.ts` - Error helper function


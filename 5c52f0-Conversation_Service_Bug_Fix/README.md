# Fix Conversation Service Bugs

## Category

Bug Fix - Backend API Service (TypeScript/Prisma)

## Problem Statement

A chat application's conversation service is experiencing multiple issues in production. Users report seeing wrong conversations on page 2+, slow response times, memory crashes when opening large conversations, and duplicate conversation titles. The delete operation occasionally fails with database errors. Your task is to identify and fix all bugs while maintaining API compatibility.

---

## Prompt

**Role:** Senior Backend Engineer

**Context:** The `conversationService.ts` handles all conversation CRUD operations for a real-time chat platform. Production monitoring reveals:
- Users on page 2+ see wrong conversations (pagination bug)
- Response times 2x slower than expected (query inefficiency)
- Memory crashes when opening conversations with 5000+ messages
- Two users creating conversations simultaneously get same title
- Delete operation fails with "foreign key constraint" errors

**Scale Assumptions:**
- 10,000+ active conversations
- Average conversation: 200 messages, max: 50,000 messages
- 500+ concurrent users during peak hours

---

## Core Requirements (Must Fix)

1. Fix pagination calculation - page 1 should show first items, not skip them
2. Run independent database queries in parallel using Promise.all
3. Limit messages fetched in getConversationById to prevent memory issues with large conversations
4. Fix race condition in title generation - use atomic operation or unique constraint
5. Fix hasNext pagination calculation to correctly detect last page
6. Handle message deletion before conversation deletion to avoid foreign key errors

---

## Edge Cases (Must Handle)

7. Maintain exact same response format and method signatures for API compatibility
8. Empty conversations should return proper pagination response
9. Concurrent createConversation calls must generate unique titles

---

## Acceptance Criteria

1. Page 1 returns first N conversations, page 2 returns next N (not skipping page 1)
2. getAllConversations executes queries in parallel, not sequentially
3. getConversationById with 10,000+ messages does not crash - uses pagination or limit
4. Concurrent createConversation calls generate unique titles
5. hasNext is false on the actual last page, not one page early
6. deleteConversation succeeds even when conversation has messages

---

## Constraints

- Prisma ORM: Must use Prisma (no raw SQL unless necessary)
- API Compatibility: Maintain exact method signatures and return types
- No Breaking Changes: Response format must stay identical

---

## Definition of Done

1. All pagination tests pass (page 1 shows first items)
2. Parallel queries reduce response time
3. Memory usage stays constant for large conversations
4. No duplicate titles under concurrent load
5. Delete works with or without messages

---

## Commands

### Run repository_before
```bash
docker-compose run --rm run_before
```


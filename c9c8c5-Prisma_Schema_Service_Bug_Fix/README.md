# Fix Prisma Schema & Service Bugs

## Category

**Bug Fix - Database Schema & Backend Service (TypeScript/Prisma)**

---

## Problem Statement

A chat application is experiencing data integrity issues, slow queries, and runtime errors. Investigation reveals bugs in both the Prisma schema design and the service layer that interacts with it. Users report duplicate conversation titles, slow message loading, failed deletions, and missing timestamps. Your task is to fix both the schema and the service code while maintaining backward compatibility.

---

## Prompt

**Role:** Senior Backend Engineer

**Context:** The application has a Prisma schema (`prisma/schema.prisma`) and a `chatService.ts` that manages conversations and messages. Production monitoring reveals:
- Duplicate conversation titles causing confusion
- Message queries taking 2+ seconds on large conversations
- Delete operations failing with constraint errors
- Large message content being truncated

**Scale Assumptions:**
- 50,000+ conversations
- Average 500 messages per conversation
- Message content up to 10,000 characters

---

## Core Requirements (Must Fix)

### Schema Fixes:
1. Add unique constraint to prevent duplicate conversation titles
2. Add database index on `conversationId` for faster message queries
3. Add compound index on `[conversationId, createdAt]` for sorted queries
4. Change `content` field to support large text (10,000+ chars)
5. Add proper default value for `isFromUser` field
6. Add `onDelete: Cascade` to handle message deletion when conversation is deleted

### Service Fixes:
7. Handle unique constraint violation when creating conversations (return 409)
8. Use indexed fields in queries for better performance
9. Handle cascade delete properly (delete messages before conversation OR use cascade)
10. Return proper error messages for constraint violations

---

## Edge Cases (Must Handle)

11. Empty title should be allowed (nullable)
12. Concurrent conversation creation with same title
13. Deleting conversation with thousands of messages
14. Message content exactly at limit (10,000 chars)

---

## Acceptance Criteria

1. Creating two conversations with same title returns 409 Conflict
2. Message queries use index (check with EXPLAIN)
3. Delete conversation with messages succeeds
4. Message content up to 10,000 chars saves correctly
5. Schema migrations run without errors

---

## Files to Fix

1. `prisma/schema.prisma` - Database schema
2. `chatService.ts` - Service layer

---

## API Compatibility

- Method signatures must remain unchanged
- Response formats must remain unchanged
- Error codes: 409 for duplicates, 404 for not found, 500 for server errors


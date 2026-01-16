# Add Message Threading (Replies) Feature

## Category

**New Feature Development - Backend Service (TypeScript/Prisma)**

---

## Problem Statement

The chat application needs to support threaded conversations where users can reply to specific messages. Currently, all messages in a conversation are flat (no parent-child relationship). Your task is to implement message threading by adding reply functionality to the existing Message Service. Users should be able to reply to any message, view all replies to a message, and the system should handle edge cases like deleting messages with replies.

---

## Prompt

**Role:** Senior Backend Engineer

**Context:** You have an existing chat application with Conversations and Messages. The product team wants to add threading support so users can reply to specific messages instead of just posting to the conversation. This is similar to Slack's thread feature.

**Scale Assumptions:**
- 50,000+ conversations
- Average 500 messages per conversation
- Up to 50 replies per message
- Maximum thread depth: 1 level (replies to replies not allowed)

---

## Core Requirements (Must Implement)

### Schema Changes:
1. Add `parentId` field to Message model (nullable, references another Message)
2. Add self-relation for parent-child messages (parent and replies fields)
3. Add index on `parentId` for fast reply queries
4. Handle `onDelete` behavior when parent message is deleted (Cascade)

### Service Methods to Add:
5. `replyToMessage(parentId, content, isFromUser)` - Create a reply to a message
6. `getReplies(messageId, page, limit)` - Get paginated replies for a message
7. `getReplyCount(messageId)` - Get total reply count for a message
8. `getMessagesWithReplyCount(conversationId)` - Get messages with reply counts

### Validation:
9. Cannot reply to a reply (max depth = 1)
10. Cannot reply to a message in a different conversation
11. Parent message must exist

---

## Edge Cases (Must Handle)

12. Deleting a message with replies (cascade delete replies)
13. Reply to non-existent message (404)
14. Reply to a reply (400 - threading depth exceeded)
15. Get replies for message with no replies (empty array, not error)

---

## Acceptance Criteria

1. `replyToMessage` creates a message with correct `parentId`
2. `getReplies` returns only direct replies, paginated
3. `getReplyCount` returns accurate count
4. Replying to a reply returns 400 error
5. Replying to non-existent message returns 404
6. Deleting parent message handles replies correctly
7. Schema migration runs without errors

---

## Files to Modify

1. `prisma/schema.prisma` - Add threading fields to Message model
2. `messageService.ts` - Add threading methods

---

## API Compatibility

- Existing method signatures must remain unchanged
- New methods follow same patterns (pagination, error handling)
- Error codes: 400 for validation, 404 for not found, 500 for server errors


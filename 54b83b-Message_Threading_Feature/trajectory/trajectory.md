# Trajectory

## Task: Message Threading Feature

### Steps to Implement

1. Add `parentId String?` field to Message model
2. Add self-relation: `parent Message?` and `replies Message[]`
3. Add `@@index([parentId])` for fast reply queries
4. Add `onDelete: Cascade` to delete replies when parent deleted
5. Implement `replyToMessage(parentId, content, isFromUser)` method
6. Implement `getReplies(messageId, page, limit)` with pagination
7. Implement `getReplyCount(messageId)` returning number
8. Implement `getMessagesWithReplyCount(conversationId)` with _count
9. Validate: Cannot reply to a reply (check if parent has parentId)
10. Validate: Parent message must exist (404 if not)


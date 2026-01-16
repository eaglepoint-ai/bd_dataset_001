# Trajectory

## Task: Prisma Schema & Service Bug Fix

### Steps to Fix

1. Add `@@unique([title])` to Conversation model
2. Add `@@index([conversationId])` to Message model
3. Add `@@index([conversationId, createdAt])` to Message model
4. Change `content String` to `content String @db.Text`
5. Add `@default(false)` to `isFromUser` field
6. Add `onDelete: Cascade` to conversation relation
7. Handle P2002 error in createConversation for 409 response
8. Use transaction or cascade for deleteConversation


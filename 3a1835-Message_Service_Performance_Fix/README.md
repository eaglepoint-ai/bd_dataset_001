# Optimize Message Service Database Queries

## Category

Performance Optimization - Backend API (TypeScript/Prisma)

## Problem Statement

A chat application's message service is experiencing severe performance issues under load. The API handles 50,000+ messages per day across 10,000+ conversations. Users report slow response times (2-5 seconds) for message listing and creation. Database monitoring shows excessive query counts and high memory usage on the API servers. Your task is to optimize the service to handle the current load with sub-200ms response times.

---

## Prompt

**Role:** Senior Backend Engineer

**Context:** The `messageService.ts` handles all message operations for a real-time chat platform. Performance monitoring reveals:
- Average response time: 2.5 seconds (target: <200ms)
- Database queries per request: 4-6 (target: 1-2)
- Memory spikes during pagination: 500MB+ (target: <50MB)
- P99 latency: 8 seconds during peak hours

**Scale Assumptions:**
- 50,000+ messages created daily
- 10,000+ active conversations
- Average conversation: 200 messages
- Peak concurrent users: 5,000

---

## Core Requirements (Must Fix)

### 1. Eliminate Redundant Queries
- Remove duplicate conversation existence checks
- Consolidate queries where possible

### 2. Use Parallel Queries
- Independent queries must run in parallel with Promise.all
- Never run sequential queries that could be parallel

### 3. Fix Memory-Inefficient Pagination
- Use database-level pagination (skip/take)
- Never fetch all records then slice in JavaScript

### 4. Optimize Data Fetching
- Only select columns that are needed
- Avoid over-fetching with unnecessary includes

### 5. Fix N+1 Query Problem
- Batch related data fetching
- Use includes/joins instead of loops

---

## Edge Cases (Must Handle)

### 6. Empty Conversations
- Handle pagination correctly when no messages exist

### 7. Large Conversations
- 10,000+ messages must not cause memory issues

### 8. Concurrent Requests
- Multiple requests for same conversation must be efficient

---

## Constraints

- Prisma ORM: Must use Prisma (no raw SQL unless necessary)
- API Compatibility: Maintain exact method signatures and return types
- No Breaking Changes: Response format must stay identical

---

## Definition of Done

1. Maximum 2 database queries per API call
2. All independent queries run in parallel
3. Memory usage stays under 50MB for any request
4. Response time under 200ms for typical requests
5. No N+1 query patterns

---

## Acceptance Criteria

1. `getMessagesByConversationId` uses max 2 queries with database-level pagination
2. `createMessage` uses a transaction for atomic operations
3. `getMessageById` doesn't over-fetch conversation data or all messages
4. `getRecentMessagesAcrossConversations` has no N+1 queries (single query with include)
5. Pagination doesn't load all messages into memory
6. Empty conversation returns proper empty pagination
7. All methods maintain exact same response format

---

## Commands

### 1. Run repository_before tests
```bash
docker-compose run --rm run_before
```
This command will:
- Build the Docker image (if not already built)
- Install all dependencies
- Generate Prisma client
- Set up database schema
- Run tests for the "before" implementation

### 2. Run repository_after tests
```bash
docker-compose run --rm run_after
```
This command will:
- Build the Docker image (if not already built)
- Install all dependencies
- Generate Prisma client
- Set up database schema
- Run tests for the optimized "after" implementation

### 3. Run evaluation
```bash
docker-compose run --rm evaluation
```
This command will:
- Build the Docker image (if not already built)
- Install all dependencies
- Generate Prisma client for both repositories
- Set up database schema
- Run tests for both before and after
- Generate evaluation report at `evaluation/report.json`

**Note:** All commands work independently and handle all setup automatically. No manual intervention required.


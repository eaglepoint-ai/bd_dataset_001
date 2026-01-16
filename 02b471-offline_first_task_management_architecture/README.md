# Offline-First Task Management Architecture

## Prompt

You are a **Senior Mobile/Web Engineer** at a productivity SaaS company serving **field workers, remote teams, and users with unreliable internet connectivity**.  
Users frequently work in **subways, airplanes, rural areas, or regions with intermittent networks**, yet the application must remain fully functional at all times.

The current implementation follows a **naive request-response model** where every action requires immediate network access.  
There is no caching, no offline support, no synchronization strategy, and no conflict resolution—leading to **data loss, blocked workflows, and severe user frustration**.

Your mission is to design and implement a **robust offline-first architecture** that guarantees usability, data integrity, and seamless synchronization under all network conditions.

---

## Problem Statement

The existing task management application fails completely when network connectivity is lost, blocking user actions and causing irreversible data loss.  
Users cannot create, edit, or complete tasks offline, and changes made during outages are never synchronized.  
There is no optimistic UI, no offline queue, and no conflict resolution across devices.  
The system must be redesigned to operate **offline by default**, while ensuring reliable synchronization and zero data loss.

---

## Requirements

### Offline-First Core Requirements

- Application must function **fully without internet connectivity**
- All CRUD operations must work offline with immediate UI feedback
- No user data may be lost under any circumstance
- Sync must happen automatically when connectivity is restored
- Sync state must be visible to the user at all times

---

### Architectural Requirements

Implement **three clearly separated layers**:

#### 1. Cache Management Layer
- Cache tasks using `window.storage`
- Load cached data immediately on app mount (<200ms)
- Update cache on every data mutation
- Handle cache invalidation safely

#### 2. Offline Queue Management
- Queue all mutations when offline:
  - Create
  - Update
  - Delete
- Persist queue so it survives page refreshes
- Replay queued operations in order when back online
- Support up to **100 pending operations**
- Gracefully handle partial failures

#### 3. Sync Engine
- Detect network status using:
  - `navigator.onLine`
  - `window.addEventListener('online' | 'offline')`
- Auto-sync within **3 seconds** of reconnection
- Support manual sync trigger
- Prevent duplicate operations during unstable connectivity

---

### Optimistic Updates

- UI must update **immediately** on user action
- Do not wait for server confirmation
- Show pending state for unsynced items
- Assign temporary IDs for offline-created tasks
- Roll back only if server explicitly rejects the operation

---

### Conflict Resolution

- Use timestamp-based versioning (`updatedAt`)
- Detect conflicts during sync
- Implement one of:
  - **Last-write-wins**, or
  - Explicit conflict resolution UI
- No silent overwrites
- No silent data loss

---

### Data & Feature Preservation

The solution must preserve **all existing functionality**:
- Full CRUD support
- Task fields:
  - Title
  - Completed status
  - Priority
  - Created / Updated timestamps
- Real-time UI updates
- Multi-device usage

---

## Technical Constraints

### Allowed
- `window.storage` (persistent key-value storage)
- `navigator.onLine`
- `window.addEventListener('online' | 'offline')`
- Standard React state management

### Forbidden
- IndexedDB  
- localStorage / sessionStorage  
- External libraries  
- Disabling features while offline  
- Silent sync failures  

---

## Performance & UX Targets

- Initial load from cache: **< 200ms**
- UI update latency: **< 16ms**
- Sync queue capacity: **100 operations**
- Sync completion: **< 5 seconds for 20+ ops**
- Zero data loss under all conditions

---

## Visual & UX Requirements

- Clear sync status indicators:
  - **Synced**
  - **Pending**
  - **Syncing**
  - **Error**
- User must always know:
  - What is saved
  - What is pending
  - What failed
- No blocking alerts
- No frozen UI

---

## Acceptance Criteria

1. All CRUD operations work offline  
2. UI updates immediately with optimistic behavior  
3. Data persists across page refresh while offline  
4. Auto-sync triggers on reconnection  
5. Sync completes within SLA  
6. Clear sync status visible at all times  
7. Zero data loss verified under stress testing  
8. Conflict resolution works across devices  
9. Network instability does not cause duplication  
10. Long offline sessions sync correctly  

---

## Test Scenarios

### Offline CRUD Test
- Go offline
- Add 5 tasks, edit 3, delete 2  
- UI updates immediately  
- Queue shows 10 pending operations  

### Page Refresh Test
- Offline with pending changes
- Refresh page  
- Tasks and queue persist  

### Reconnection Sync Test
- Perform 20 operations offline
- Go online  
- All sync within 5 seconds  

### Conflict Resolution Test
- Edit same task on two offline devices
- Reconnect both  
- Conflict detected and resolved  

### Network Instability Test
- Toggle offline/online repeatedly  
- No duplication, no loss  

### Long Offline Test
- Offline for 24+ hours with 100 operations  
- All operations sync successfully  

---

## Goal

Deliver a **production-grade offline-first architecture** that:
- Works anywhere, anytime
- Never loses user data
- Feels fast and responsive
- Scales across devices
- Handles real-world network failures gracefully

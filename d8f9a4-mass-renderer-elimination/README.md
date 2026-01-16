# React Chat: Mass Rerender Elimination Challenge

## Prompt

You are a Senior Frontend Engineer at a real-time messaging platform serving enterprise clients. The chat application handles conversations with 10,000+ messages, but critical performance issues are driving customer churn.

Your team owns the `ChatWindow` component that displays real-time chat messages with markdown rendering, reactions, nested threads, and inline editing capabilities. Every keystroke in the message input field currently triggers a complete rerender of all 10,000 messages, causing 2-3 second UI freezes and 800MB memory usage.

The VP of Engineering has mandated an immediate fix that eliminates unnecessary rerenders while maintaining exact behavioral equivalence for all live update features (WebSocket messages, edits, reactions).

---

## Problem Statement

### Current Behavior

**Performance Crisis:**
- Typing in the input field causes 2-3 second UI freeze
- Console shows 10,000 "Rendering message X" logs per keystroke
- Memory usage: 800MB (target: <300MB)
- CPU profiler shows unnecessary markdown rendering for all messages

**Root Cause:**

The `ChatWindow` component manages `inputValue` state. Every keystroke causes the parent to rerender, which recreates all callback functions passed to child `Message` components. React sees new function references and rerenders all 10,000 messages unnecessarily.
```jsx

{messages.map(message => (
  <Message
    key={message.id}
    message={message}
    isEditing={editingId === message.id}
    onStartEdit={() => setEditingId(message.id)}     
    onSaveEdit={(content) => handleEditMessage(...)}  
    onAddReaction={(emoji) => handleAddReaction(...)}  
  />
))}
```

**Why Everything Rerenders:**
1. User types → `inputValue` state changes in `ChatWindow`
2. `ChatWindow` rerenders → all callback props get new function references
3. React compares props → sees different function references → assumes change
4. All 10,000 `Message` components rerender with expensive markdown processing

### Expected Behavior

**Correct Rerender Behavior:**

| Action | Should Rerender | Currently Rerenders |
|--------|----------------|---------------------|
| Type in input field | 0 messages | 10,000 messages |
| New WebSocket message arrives | 1 message (new) | 10,001 messages |
| Edit message #42 | 1 message (#42) | 10,000 messages |
| Add reaction to message #100 | 1 message (#100) | 10,000 messages |

---

## Requirements

### Functional Requirements

**Must Preserve All Features:**
- Inline message editing with textarea
- Emoji reaction picker and counters  
- Nested thread replies with markdown rendering
- User avatars and timestamps
- Real-time WebSocket message updates
- Edit button visibility on hover

**Live Updates (Critical):**
- New messages appear instantly without lag
- Message edits reflect immediately (only edited message rerenders)
- Reaction additions update immediately (only affected message rerenders)
- All state changes visible within 16ms (60fps)

### Performance Requirements

**Primary Success Metric:**
```
Test: Type "hello world" in input field
Expected: Zero "Rendering message X" console logs
Current: 10,000 logs per keystroke
```

**Memory Constraints:**
- Maximum memory usage: 300MB with 10,000 messages
- Current memory usage: 800MB
- Memoization cache limit: 100 components maximum (LRU eviction)

**Component Rerender Precision:**
- Typing in input → 0 message rerenders
- New message via WebSocket → 1 rerender (new message only)
- Edit message → 1 rerender (edited message only)
- Add reaction → 1 rerender (affected message only)

### Technical Constraints

**Required Patterns:**
- Must use `React.memo()` with custom comparison function
- Comparison function must explicitly check props for equality
- Must demonstrate understanding of reference vs deep equality
- Component hierarchy must remain: `ChatWindow` → `Message`

**Forbidden Patterns:**
- `React.memo()` without custom comparison function
- `useMemo()` on entire messages array
- Adding `useEffect` hooks inside `Message` component
- Lifting `editContent` or `showReactionPicker` state out of `Message`
- Removing or simplifying any features

**Component State Management:**
- `editContent` state must remain inside `Message` component
- `showReactionPicker` state must remain inside `Message` component
- Input field state must remain in `ChatWindow` component

### Acceptance Criteria

**Test Scenario 1 - Input Typing:**
```
Action: Type "hello" in input field
Verify: Zero console logs
Verify: Render count badges do NOT increment
```

**Test Scenario 2 - New Message:**
```
Action: Send new message via WebSocket
Verify: Only "Rendering message [newId]" appears once
Verify: Existing messages don't rerender
```

**Test Scenario 3 - Message Edit:**
```
Action: Click Edit on message #5, change text, save
Verify: Only "Rendering message 5" appears once
Verify: Other messages unchanged
```

**Test Scenario 4 - Reaction Addition:**
```
Action: Add 👍 reaction to message #10
Verify: Only "Rendering message 10" appears once
Verify: Reaction counter updates correctly
```

**Test Scenario 5 - Memory Compliance:**
```
Setup: Load 10,000 messages
Action: Perform all above actions
Verify: Memory usage ≤ 300MB (DevTools measurement)
```

---

## Tech Stack

### Core Technologies
- **React:** 18.x (Hooks API)
- **JavaScript:** ES6+ (functional components only)

### React APIs Required
- `React.memo()` - Component memoization with custom comparison
- `useState()` - Component state management
- `useRef()` - Render count tracking
- `useEffect()` - WebSocket setup and lifecycle

### Performance Tools
- **Browser DevTools:** Memory profiler, performance profiler
- **Console Logging:** Rerender verification via `console.log`
- **Performance API:** `performance.now()` for markdown render simulation

### Key Concepts Tested
- React reconciliation algorithm
- Reference equality vs deep equality
- Function reference stability
- Prop comparison strategies
- Memoization trade-offs
- Component rerender optimization

### Constraints
- No external state management libraries (Redux, Zustand, MobX)
- No external memoization libraries (Reselect, use-memo-one)
- No performance libraries (React Query, SWR)
- Standard library only
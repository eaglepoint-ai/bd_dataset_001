# AI Implementation Trajectory: `useIsMobile` Hook

## Overview
This document outlines the systematic reasoning for implementing the `useIsMobile` hook, designed to detect mobile viewport sizes in a React + TypeScript project using Tailwind CSS breakpoints.

**Requirements**:
1. React
2. TailwindCSS
3. TypeScript

---

## Phase 1: Problem Understanding

### Step 1.1: Analyze Requirements
- Implement a reusable hook called `useIsMobile`.
- Detect mobile viewport (`<768px` according to Tailwind `md` breakpoint).
- Must be reactive on window resize.
- Must be SSR-safe.
- Written in TypeScript.

**Key Questions**:
- How to detect mobile safely during SSR?
- How to update state on window resize without memory leaks?
- How to align breakpoint with TailwindCSS?

---

## Phase 2: Design Decisions

### Step 2.1: Public API
```ts
function useIsMobile(): boolean | undefined
```
- Returns `undefined` initially (SSR safety).
- Returns `true` if viewport width < 768px, `false` otherwise.

### Step 2.2: Detection Strategy
- Use `window.innerWidth < 768` inside `useEffect`.
- Add `resize` event listener for reactive updates.
- Remove listener on unmount to avoid memory leaks.

---

## Phase 3: Implementation Plan

1. Initialize state: 
```ts
const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);
```
2. Use `useEffect` to:
   - Define `handleResize` function.
   - Set initial state.
   - Attach `window.resize` listener.
   - Return cleanup function to remove listener.
3. Return `isMobile` from the hook.

---

## Phase 4: Implementation

```ts
import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean | undefined {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}
```

---

## Phase 5: Validation

### Step 5.1: Test Cases
- Initial render: returns `undefined`.
- Width < 768px: returns `true`.
- Width ≥ 768px: returns `false`.
- Updates correctly on `resize`.
- Event listeners removed on unmount.

### Step 5.2: Compliance Checks
- [x] React hook implemented ✅
- [x] Tailwind breakpoint used ✅
- [x] TypeScript types correct ✅

---

## Phase 6: Summary
The `useIsMobile` hook:
- Fully meets **React + Tailwind + TypeScript requirements**.
- Is SSR-safe (`undefined` initial state).
- Reactive on window resize with cleanup.
- Minimal and readable code.

**Success Criteria Met**:
- Hook works as intended.
- Compatible with Tailwind breakpoints.
- Type-safe and production-ready.

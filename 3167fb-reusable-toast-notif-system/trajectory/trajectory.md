# Project Trajectory: Reusable Toast Notification System



## Define a Technical Contract
First, I defined the performance and reliability conditions: the system must handle multiple concurrent notifications, ensure stable ordering in the viewport, provide bit-perfect type safety via TypeScript, and guarantee automatic DOM cleanup for every toast.


## Rework the State Model for Efficiency
I introduced a reactive `toastStore` using Vue 3's `reactive` API. This stores a centralized queue of objects, preventing orphaned notifications and ensuring the UI is always a reflection of truth. This is far more efficient than tracking multiple component-local states.


## Rebuild the API as a Composable-First Pipeline
The trigger pipeline now selects only essential options to build lightweight toast objects. Using a "Composable-First" approach reduces the overhead of entity materialization in the component tree.

## Move Logic to Composables (Client-Side)
Logic for variant helpers (`success()`, `error()`, etc.) and the auto-dismissal timers now resides in the `useToast` composable. This translates trigger calls into predictable state changes that benefit from Vue's optimized reactivity system.

## Use Transitions Instead of Manual DOM Manipulation
The system now uses `<TransitionGroup>` for entry/exit animations. This prevents the "exploding" layout issues common in manual DOM manipulation and leverages hardware acceleration for smooth 60fps glassmorphism effects.

## Auto-Dismissal + Visual Progress
I implemented precise timers for auto-dismissal. To improve user feedback, I added a synchronized progress bar. 
## Eliminate Memory Leaks
I eliminated potential memory leaks by ensuring all `setTimeout` timers are cleared on manual dismissal or component unmount. For a sequence of toasts, listeners are managed in a batch rather than one per instance.


## Normalize for Project Variants
Added a normalized type system for toast variants (Success, Error, Warning, Info). This ensures consistent iconography and CSS variable injection without killing performance with complex conditional rendering.

## Result: Measurable Reliability + Premium UX
The solution consistently uses a single source of truth, never touches the DOM directly, stays animation-friendly with GPU-accelerated glassmorphism, and exhibits measurable UX improvements (staggered animations, predictable timing, and zero orphaned elements).
Final methodology for efficient UI: [Modern Component Testing with Vitest](https://vitest.dev/guide/browser.html)

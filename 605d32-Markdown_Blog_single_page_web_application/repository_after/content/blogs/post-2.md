---
title: Building SPAs Without Frameworks
date: 2024-02-20
tags: web development, vanilla javascript, spa
---

# Building SPAs Without Frameworks

Modern web development often relies on frameworks, but it's entirely possible to build Single Page Applications using only vanilla JavaScript and browser APIs.

## Why Go Framework-Free?

Frameworks are powerful, but they come with trade-offs:

- **Bundle Size**: Frameworks add significant weight to your application
- **Learning Curve**: Team members need to learn framework-specific patterns
- **Flexibility**: Sometimes you need fine-grained control over behavior

## Core Concepts

A SPA needs three main components:

1. **Routing**: Handle navigation without page reloads
2. **State Management**: Track application state
3. **DOM Manipulation**: Update the UI efficiently

## Implementing Routing

The History API provides everything we need:

```typescript
function navigate(path: string): void {
  window.history.pushState({}, '', path);
  renderCurrentRoute();
}

window.addEventListener('popstate', () => {
  renderCurrentRoute();
});
```

## Conclusion

Building framework-free SPAs teaches you the fundamentals of web development. While frameworks are valuable tools, understanding the underlying APIs makes you a better developer.

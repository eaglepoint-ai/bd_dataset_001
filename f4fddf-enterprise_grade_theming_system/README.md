# Enterprise-Grade Theming System (WCAG AAA, Zero Storage)

## Prompt

You are a **Principal Frontend Architect** at a Fortune 500 financial services company.  
Due to **PCI-DSS security requirements**, all browser storage APIs (localStorage, sessionStorage, IndexedDB, cookies) are disabled.  
At the same time, the **compliance team mandates WCAG AAA accessibility**, and the product must support **light, dark, and system themes**.

The application includes **real-time collaboration features**, meaning user theme preferences must be **isolated per user** and architected for future **server-side persistence**.  
For this prototype, **only React state management is allowed**, but the design must scale to multi-tenant environments.

---

## Problem Statement

The application must support a fully accessible, high-performance theming system without relying on browser persistence or external libraries.  
Theme changes must be visually stable, performant, and isolated per user session.  
System theme preferences must be respected unless explicitly overridden by the user.  
The solution must meet enterprise accessibility, performance, and architectural standards.

---

## Requirements

### Architectural Constraints

#### State Management
- Implement a custom `useTheme` hook that encapsulates **all theme logic**
- Use **React Context API + useReducer** (no useState)
- Reducer must support:
  - `SET_THEME`
  - `TOGGLE_THEME`
  - `SYNC_SYSTEM_THEME`
- No prop drilling — theme must be accessible anywhere via the hook
- Theme architecture must support future **server-side persistence**

---

### Design Token System

Define **15+ semantic design tokens**, including:

- **Backgrounds**
  - `--bg-primary`
  - `--bg-secondary`
  - `--bg-tertiary`

- **Text**
  - `--text-primary`
  - `--text-secondary`
  - `--text-muted`

- **Interactive States**
  - `--interactive-default`
  - `--interactive-hover`
  - `--interactive-active`

- **Semantic Colors**
  - `--color-success`
  - `--color-error`
  - `--color-warning`
  - `--color-info`

- **Borders & Shadows**
  - `--border-color`
  - `--shadow-sm`
  - `--shadow-md`
  - `--shadow-lg`
  - `--focus-ring`

**Rules**
- Tokens must be injected via a `<style>` tag in `document.head`
- All inline styles must reference `var(--token-name)`
- No hardcoded colors
- No CSS classes or external stylesheets


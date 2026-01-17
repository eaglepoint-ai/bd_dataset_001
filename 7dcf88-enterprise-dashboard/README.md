# Enterprise Dashboard Data-Fetching 

## Prompt

You are a **Senior Full-Stack Engineer** at a **Series C SaaS company** providing project management software to **Fortune 500 clients** with **50,000+ daily active users**.  
The dashboard has become critically slow, threatening customer retention.

Your task is to **refactor the dashboard data-fetching architecture** to eliminate the **N+1 sequential request pattern** causing **8+ second page loads**.  
The solution must reduce **9 sequential HTTP requests to ≤3 parallel requests**, while:

- Preserving **complete component independence**
- Maintaining **zero breaking changes** to existing component interfaces used across **15+ features**

---

## Problem Statement

The dashboard currently suffers from severe performance degradation due to an architectural flaw in data fetching. Each dashboard component independently initiates its own API requests during mount, resulting in a **sequential HTTP waterfall**.

As the number of projects grows, request count scales linearly (`2N + 3`), leading to unacceptable page load times (up to **8.2s**) despite a well-optimized backend. This degradation has caused a **33% drop in customer satisfaction**, **15% at-risk renewals**, and **$2.3M in lost Q4 revenue**.

The challenge is to **eliminate redundant sequential requests** while ensuring that all components continue to function **unchanged** both inside and outside the dashboard context.

---

## Requirements

### Functional Requirements
- Reduce total dashboard requests to **≤3**
- Execute requests **in parallel** (same event loop tick)
- Preserve **exact component behavior**
- Components must:
  - Use prefetched data when rendered in dashboard
  - Fetch their own data when rendered standalone
- No prop interface changes (200+ callsites)
- No backend or API changes

### Performance Targets
| Metric | Current | Target |
|------|--------|--------|
| Page Load | 8.2s | < 1.5s |
| Requests (3 projects) | 9 | ≤ 3 |
| Request Pattern | Sequential | Parallel |
| Scalability | 2N + 3 | Constant (≤3) |
| Bundle Size Increase | N/A | < 5KB |

### Hard Constraints
**Forbidden:**
- Third-party libraries (Redux, React Query, SWR, Zustand, Apollo, etc.)
- Component merging or monolithic redesigns
- Backend API changes or new endpoints
- Changing component props
- Context-dependent API utilities

---

## Tech Stack

### Frontend
- **React 18.2**
  - Functional components
  - Hooks
  - Context API
- **Vanilla TypeScript / JavaScript**
- **Standard Fetch API**

### Architecture Constraints
- No external state or data-fetching libraries
- Components reused across:
  - Dashboard
  - Search
  - Reports
  - Emails / PDFs
  - Mobile headers
- APIs must remain **individually callable**

---

## Definition of Done

- Dashboard mount triggers **≤3 HTTP requests**
- Requests fire **in parallel** (<50ms variance)
- Page loads in **<1.5s**
- `<ProjectCard />` works:
  - Optimized in dashboard
  - Independently when isolated
- Zero breaking changes to component props
- No external libraries added
- Bundle size increase <5KB
- Clear inline architectural documentation

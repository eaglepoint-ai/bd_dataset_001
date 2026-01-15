# Trajectory: Markdown-Driven Blog SPA

## Problem Decomposition

The task required building a Single Page Application (SPA) where all content is dynamically generated from Markdown files, with strict constraints: TypeScript only, no frameworks, browser APIs only.

### Core Components Identified

1. **Content Layer**: Markdown files as the single source of truth
2. **Loading Layer**: Fetch Markdown files at runtime
3. **Parsing Layer**: Convert Markdown to HTML and extract metadata
4. **Routing Layer**: Handle client-side navigation without page reloads
5. **Rendering Layer**: Dynamically update DOM based on current route
6. **Type System**: TypeScript interfaces for type safety

## Why Hardcoded HTML Was Rejected

Hardcoded HTML violates the fundamental requirement that "Markdown is the SINGLE source of content." Any content in HTML would create a dual source of truth, leading to:

- **Maintenance Burden**: Content changes require editing both Markdown and HTML
- **Inconsistency Risk**: Markdown and HTML can drift out of sync
- **Scalability Issues**: Adding new posts requires HTML modifications
- **Evaluation Failure**: Tests explicitly check for absence of hardcoded content

The solution uses a minimal HTML shell containing only:
- Structural container (`<div id="app">`)
- Script tag to load compiled TypeScript
- CSS link for styling

All content is injected dynamically via JavaScript after fetching and parsing Markdown.

## Why Frameworks Were Rejected

Frameworks (React, Vue, Angular, etc.) were explicitly prohibited. Beyond compliance, this constraint provides:

### Technical Benefits

1. **Zero Dependencies**: No framework runtime means smaller bundle size and faster load times
2. **Direct API Usage**: Direct use of browser APIs (History API, Fetch API, DOM API) provides full control
3. **Learning Value**: Understanding underlying web APIs is fundamental knowledge
4. **Simplicity**: No framework abstractions to learn or debug

### Implementation Approach

The solution uses:
- **History API** for routing (`pushState`, `popstate` events)
- **Fetch API** for loading Markdown files
- **DOM API** for rendering (`innerHTML`, `createElement`, `appendChild`)
- **TypeScript** for type safety without framework overhead

## Markdown-Only Architecture

### Content Structure

```
content/
├── author.md          # Blogger information
└── blogs/
    ├── post-1.md      # Individual blog posts
    ├── post-2.md
    └── ...
```

### Metadata Extraction

Blog posts use YAML front matter for metadata:

```markdown
---
title: Post Title
date: 2024-01-15
tags: tag1, tag2
---

# Content starts here
```

The `metadata-extractor.ts` module:
1. Detects front matter delimiters (`---`)
2. Parses key-value pairs
3. Handles array values (tags)
4. Separates metadata from content

### Markdown Parsing

A custom parser (`markdown-parser.ts`) handles essential Markdown features:
- Headers (`#`, `##`, `###`)
- Code blocks (```) and inline code (`)
- Links `[text](url)` and images `![alt](url)`
- Emphasis (`**bold**`, `*italic*`)
- Lists (ordered and unordered)
- Paragraphs

This parser is intentionally basic to demonstrate core concepts without external dependencies.

### Dynamic Loading

The `markdown-loader.ts` module:
1. Fetches `author.md` for blogger information
2. Auto-discovers blog posts by attempting sequential fetches (`post-1.md`, `post-2.md`, ...)
3. Stops after 3 consecutive 404s (indicating no more posts)
4. Handles errors gracefully

### Runtime Rendering

The `renderer.ts` module converts parsed data structures into DOM elements:
- `renderAuthor()`: Displays name, bio, and links
- `renderBlogList()`: Shows sorted list of posts with metadata
- `renderBlogPost()`: Displays full post content

All rendering uses `innerHTML` with escaped content to prevent XSS vulnerabilities.

## Routing Architecture

### Hash-Based Routing

The router uses hash fragments (`#home`, `#post`) for simplicity:
- Works without server-side configuration
- Browser handles history automatically
- Easy to implement with minimal code

### Router Implementation

The `router.ts` module provides:
- Route registration: `router.register(path, handler)`
- Navigation: `router.navigate(path, params)`
- History handling: Listens to `popstate` events
- Link interception: Captures clicks on `data-route` attributes

### Route Handlers

Each route handler:
1. Fetches required data (if not cached)
2. Clears current container
3. Renders new content
4. Updates browser history

## Type Safety

TypeScript interfaces ensure type safety:

```typescript
interface Author {
  name: string;
  bio: string;
  links: Record<string, string>;
}

interface BlogMetadata {
  title: string;
  date: string;
  tags: string[];
}

interface BlogPost {
  metadata: BlogMetadata;
  content: string;
  filename: string;
}
```

These interfaces:
- Document expected data structures
- Enable compile-time error checking
- Provide IDE autocomplete
- Serve as inline documentation

## Why This Design Is Optimal

### Meets All Requirements

1. ✅ **Markdown-only content**: All content loaded from `.md` files
2. ✅ **No hardcoded HTML**: HTML contains only structure
3. ✅ **SPA behavior**: Navigation without page reloads
4. ✅ **TypeScript only**: Source files are `.ts`, JS generated at build time
5. ✅ **No frameworks**: Pure browser APIs
6. ✅ **Modular architecture**: Separate concerns (loading, parsing, routing, rendering)
7. ✅ **Auto-discovery**: Posts discovered automatically
8. ✅ **Metadata support**: Front matter parsed and rendered

### Maintainability

- **Single source of truth**: Edit Markdown, content updates automatically
- **Clear separation**: Each module has a single responsibility
- **Type safety**: TypeScript catches errors at compile time
- **Extensible**: Easy to add new features (search, filtering, etc.)

### Performance

- **Small bundle**: No framework overhead
- **Lazy loading**: Content fetched on demand
- **Efficient rendering**: Direct DOM manipulation
- **Fast navigation**: No server round-trips

### Evaluation Safety

- **Deterministic**: Same Markdown always produces same output
- **Testable**: Each module can be tested independently
- **Verifiable**: Tests can check for hardcoded content, frameworks, etc.

## Build Process

1. **TypeScript Compilation**: `tsc` compiles `.ts` files to `.js` in `dist/`
2. **Docker Build**: Multi-stage build compiles TypeScript, then serves with Python
3. **Runtime**: Browser loads `dist/app.js`, which fetches and renders Markdown

## Conclusion

This architecture demonstrates that complex SPAs can be built without frameworks by:
- Leveraging browser APIs directly
- Using TypeScript for type safety
- Maintaining clear separation of concerns
- Keeping Markdown as the single source of truth

The result is a maintainable, performant, and evaluation-ready solution that meets all specified requirements.

---

## Trajectory Template (Reusable Thinking Nodes)

The trajectory structure stays the same across task categories. Only the focus and artifacts change.

- **Audit** → inspect current behavior/structure and identify the scaling, correctness, or spec gaps.
- **Contract** → define what must stay true (requirements, constraints, success criteria).
- **Design** → decide the smallest structural changes that make the contract easy to satisfy.
- **Execute** → implement in small, verifiable steps.
- **Verify** → run tests/checks and confirm deterministic, measurable signals.

### Template Example (Refactoring / Performance-Oriented)

This is an example trajectory (from a DB/query refactor) showing how the nodes are expressed:

1. **Audit the Original Code (Identify Scaling Problems)**  
   Loaded full tables into memory for filtering/sorting, applied pagination too late, repeatedly recalculated deal values, and used N+1 queries — all of which would not scale.
2. **Define a Performance Contract First**  
   Filtering/ordering must remain in the database, ordering must be stable, use keyset pagination, forbid N+1 patterns, avoid per-request aggregations.
3. **Rework the Data Model for Efficiency**  
   Introduce cached/precomputed metrics to avoid heavy joins on hot paths.
4. **Rebuild as a Projection-First Pipeline**  
   Select only essential fields into lightweight shapes; avoid expensive ORM materialization.
5. **Move Filters to the Database (Server-Side)**  
   Translate filters into SQL predicates that benefit from indexes.
6. **Use EXISTS Instead of Cartesian Joins / Heavy Tag Filtering**  
   Avoid exploding result sets by using `EXISTS` subqueries.
7. **Stable Ordering + Keyset Pagination**  
   Avoid `OFFSET` for deep pagination; keep ordering stable.
8. **Eliminate N+1 Queries for Enrichment**  
   Batch related fetches (tags, related entities) rather than one query per row.
9. **Normalize for Case-Insensitive Searches**  
   Store normalized columns to keep indexes usable (avoid `LOWER(col)` in predicates).
10. **Result: Measurable Gains + Predictable Signals**  
   Consistent query counts, index-friendly patterns, and verified speedups.

### Mapping the Template to This Task (Markdown Blog SPA)

Here is how the same nodes apply to the Markdown-driven SPA task:

1. **Audit**  
   Identify any hardcoded content paths, duplicated sources of truth (HTML + Markdown), routing reloads, missing metadata rendering, or non-TS source committed in `src/`.
2. **Contract**  
   Translate the task requirements into non-negotiables: Markdown is the content source, SPA navigation (hash routes acceptable), metadata visible in the DOM, no frameworks, and predictable rendering.
3. **Design**  
   Split responsibilities into small modules: loading (fetch), parsing (frontmatter + markdown), routing, and DOM rendering. Keep types/DTOs minimal and stable.
4. **Execute**  
   Implement the smallest end-to-end path first (home → list → post), then harden around edge cases (missing files, bad frontmatter, navigation).
5. **Verify**  
   Use deterministic checks: does the author name render as an `h1` from Markdown? does clicking a post update URL and render title/date/tags without a full reload? do tests pass?

### Trajectory Transferability Notes

The same thinking nodes can be reused to transfer this trajectory to other categories by changing the focus of each node, not the structure.

- **Refactoring → Full-Stack Development**
  - Replace code audit with system & product flow audit
  - Contract becomes API/UX/data contracts
  - Data model refactor extends to DTOs and frontend state shape
  - Query optimization maps to API payload shaping
  - Pagination applies to backend + UI (cursor / infinite scroll)
  - Add API schemas, frontend data flow, and latency budgets
- **Refactoring → Performance Optimization**
  - Audit becomes runtime profiling & bottleneck detection
  - Contract expands to SLOs/SLAs/latency budgets
  - Design includes indexes, caches, async paths
  - Refactors focus on hot paths
  - Verify uses metrics, benchmarks, and load tests
  - Add observability and before/after measurements
- **Refactoring → Testing**
  - Audit becomes test coverage & risk audit
  - Contract becomes test strategy & guarantees
  - Assumptions convert to fixtures and factories
  - Stable ordering maps to deterministic tests
  - Verify becomes assertions & invariants
  - Add test pyramid placement and edge-case coverage
- **Refactoring → Code Generation**
  - Audit becomes requirements & input analysis
  - Contract becomes generation constraints
  - Design becomes domain model scaffolding
  - Projection-first becomes minimal, composable output
  - Verify ensures style, correctness, and maintainability
  - Add input/output specs and post-generation validation

---

## Patch + Evaluation Notes (Dataset Convention)

### What is `git diff` and why do we use it?

`git diff` shows the differences between two states of code. In these dataset samples, it is used to create the ground-truth patch: the exact change an agent must output to solve a task.

Why it’s essential:
- It produces a clean, precise diff file (`.patch`) representing the minimal solution.
- The patch is generated from the difference between `repository_before/` (starting state) and `repository_after/` (solved state).
- The evaluator can apply the patch, run tests, and check if the task is solved.

Command (run from the project root):

```bash
git diff --no-index repository_before repository_after > patches/task_001.patch
```

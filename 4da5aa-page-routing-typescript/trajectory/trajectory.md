# Trajectory

### Audit the Original Requirement (Identify Key Routing Features)
I analyzed the task requirements, which called for a **page-based routing system** similar to Next.js's App Router, but implemented from scratch in TypeScript. The system needed to support **file-system based routing**, **dynamic parameters** (e.g., `[slug]`), **nested layouts**, and **priority rules** (static > dynamic). The original repository (`repository_before`) was completely empty/failing, requiring a ground-up implementation.

-   **Next.js App Router Documentation (Concepts)**  
    Understand the core concepts of file-system based routing, layouts, and dynamic segments.  
    Link: https://nextjs.org/docs/app

### Build the Core Data Structures (Component Tree)
I designed a tree-based data structure (`RouteNode`) to represent the file system hierarchy in memory. This tree stores `segment` names, flags for dynamic routes (`isDynamic`, `dynamicParam`), and references to `page.tsx` and `layout.tsx` files. This separation allows for efficient resolving without constant disk I/O during every request.

-   **Tree Data Structure in TypeScript**  
    A fundamental breakdown of implementing trees, which is the backbone of this router's lookup mechanism.  
    Link: https://www.geeksforgeeks.org/implementation-binary-searcy-tree-javascript/ (General concept applied to N-ary trees)

### Implement File System Scanner (Initial Population)
I created a `scanner.ts` module to recursively walk the `pages` directory. It builds the `RouteNode` tree by identifying directories as route segments and attaching `page.tsx` or `layout.tsx` files to the corresponding nodes. It correctly parses bracket notation (e.g., `[id]`) to identify dynamic segments.

-   **Node.js recursive directory scan**  
    Standard practices for recursively reading directories to build a structural representation.  
    Link: https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search

### Develop the Matching Engine (Recursive Resolution)
I implemented `matcher.ts` to take a URL path and traverse the `RouteNode` tree to find a matching page. The matcher handles:
1.  **URL Normalization**: Stripping query parameters and handling trailing slashes.
2.  **Backtracking**: If a dynamic route matches but fails deeper in the tree, the matcher appropriately backtracks to try other paths.
3.  **Parameter Extraction**: Capturing values for dynamic segments (e.g., `[slug]` -> `my-post`).
4.  **Priority Handling**: Explicitly checking for static children *before* checking dynamic children at every level.

-   **Trie (Prefix Tree) for URL Routing**  
    The underlying algorithm used for matching URL segments to the route tree is essentially a Trie traversal.  
    Link: https://medium.com/@gregory_7465/implementing-a-trie-data-structure-in-typescript-313b3fc28664

### Implement Layout Resolution (Nested Component Stacking)
A critical feature was supporting nested layouts. I implemented a `collectLayouts` helper function that, upon finding a matching page node, walks *up* the tree to the root, collecting all `layout.tsx` components along the path. These serve as wrappers for the final page component, correctly mimicking the "russian doll" nesting of modern frameworks.

### Extensive Testing and Verification (Invariants & Edge Cases)
I populated `repository_after` with the implementation and used the extensive test suite in `tests/` to verify correctness. The tests cover:
-   **Static vs. Dynamic Priority**: ensuring `/blog/new` matches the static `new` folder, not the dynamic `[slug]`.
-   **Nested Layouts**: verifying that `/dashboard/settings` renders `RootLayout -> DashboardLayout -> SettingsPage`.
-   **404 Handling**: ensuring unknown paths correctly return `null`.
-   **Edge Cases**: Handling trailing slashes, multiple slashes, and deep nesting.
-   **Redundant Test Identification**: Identified `test_02_static_route.ts` as a functionally identical duplicate of `test_static_route.ts`.

-   **Writing Robust TypeScript Tests**  
    Best practices for testing node.js applications to ensure every edge case is covered.  
    Link: https://khalilstemmler.com/articles/software-design-architecture/unit-testing-best-practices/

### Final Integration and CI/CD Fixes
I updated the `docker-compose.yml` to support symmetric commands (`app-before` / `app-after`) and fixed a critical CI issue where the host volume mount was overwriting the container's `node_modules`. I also generated a unified patch file and successfully passed all functional validation steps.

-   **Docker Volumes & Node Modules**  
    The classic "node_modules missing in Docker" problem and its solution using anonymous volumes.  
    Link: https://stackoverflow.com/questions/30043872/docker-compose-node-modules-not-present-in-a-volume

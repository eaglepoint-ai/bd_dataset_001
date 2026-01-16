# Trajectory: Building a Text Version Control System

This document outlines the step-by-step process of building a Next.js application that treats wiki pages as version-controlled repositories with a Directed Acyclic Graph (DAG) history.

## 1. Project Initialization

We started by initializing a standard Next.js application with TypeScript and Tailwind CSS.

**Steps:**

1.  Run the Create Next App command:
    ```bash
    npx create-next-app@latest wiki-vcs --typescript --tailwind --eslint
    ```
2.  Clean up the default boilerplate code in `app/page.tsx` and `app/globals.css`.

**Resources:**

- [Next.js Documentation: Installation](https://nextjs.org/docs/getting-started/installation)
- [YouTube: Next.js 14 Tutorial for Beginners](https://www.youtube.com/watch?v=ZjAqacIC_3c)

## 2. Defining the Data Types

We defined the core data structures to support the DAG architecture. Unlike a linear blog post, our "Page" holds a Graph of "Versions".

**Key Concepts:**

- **Page**: Container for the graph.
- **Version (Node)**: Immutable state containing `content`, `author`, and `parentIds`.
- **DAG (Graph)**: Collection of Nodes and Edges connecting parents to children.

We created `lib/types.ts` to define interfaces for `WikiPage`, `VersionNode`, and `DagGraph`.

## 3. Implementing the Storage & API

Since this is a prototype/challenge, we implemented a simple in-memory store (or file-based equivalent) to persist state during the session.

**Steps:**

1.  **State Management**: Created `lib/store.ts` to hold the application state globally.
2.  **API Routes**:
    - `POST /api/pages`: Create a new wiki page.
    - `POST /api/versions`: Create a new immutable version.
    - `GET /api/pages/[id]`: Retrieve page history.

**Resources:**

- [Next.js Docs: Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## 4. Visualizing the DAG with React Flow

To fulfill the requirement of viewing history as a graph, we integrated **React Flow**.

**Steps:**

1.  Install dependencies: `npm install reactflow`
2.  Create a `DagGraph.tsx` component.
3.  Map our `VersionNode` data to React Flow's `Node` and `Edge` format.
4.  Configure the layout (using `dagre` or manual positioning) to show time progressing downward or rightward.

**Resources:**

- [React Flow Documentation](https://reactflow.dev/)
- [YouTube: React Flow Crash Course](https://www.youtube.com/watch?v=Fjrx1Xh-uSQ)

## 5. Implementing Merging & Conflict Detection

This was the most complex logic. We needed to merge text from two different branches.

**Steps:**

1.  Install `diff` library: `npm install diff @types/diff`.
2.  **Auto-Merge Strategy**:
    - Compare Version A and Version B against a common ancestor (or just against each other for simplicity in this MVP).
    - If changes occur on different lines, combine them.
    - If changes occur on the same line/chunk, flag a **Conflict**.
3.  **Merge API**: Created `/api/merge` to calculate the result and return either a success (new content) or a conflict flag.

**Resources:**

- [NPM: diff package](https://www.npmjs.com/package/diff)
- [Myers Diff Algorithm Explained](https://blog.jcoglan.com/2017/02/12/the-myers-diff-algorithm-part-1/)

## 6. Frontend: Editing and Manual Resolution

Finally, we built the UI to interact with these features.

**Features:**

- **Version Creator**: A simple text area to edit the _current_ version's content and save as a new node.
- **Merge Interface**: Ability to select two nodes in the graph and click "Merge".
- **Conflict Resolver**: If auto-merge fails, show a UI allowing the user to edit the conflicting text manually and save the "Resolved" version.

## 7. containerization

We created a `Dockerfile` and `docker-compose.yml` to ensure the application environment is reproducible and isolated for testing.

**Steps:**

1. Defined a Node.js 18 Alpine image.
2. Configured build steps for the Next.js app.
3. Set up services for running the app and executing the test suites.

## Summary

The resulting application allows users to branch off thoughts, merge them back together, and visualize the entire history of a document, meeting all the specified criteria.

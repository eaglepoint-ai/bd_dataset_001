Trajectory (Thinking Process for Implementation)

Project: RTK Query + React Hook Form + Zod Integration

Goal: Build a production-ready form and data-fetching layer from scratch.

1. Audit Requirements & Product Flow (Identify Scaling Needs)

I audited the functional requirements for a modern CRUD interface. The objective is to demonstrate a clean, production-ready pattern for integrating performant form management and declarative client-side validation. I identified that to scale, we must avoid manual state synchronization (useState for inputs) and unvalidated network requests. I've integrated patterns for shared cache subscriptions so components can use the same data without redundant network calls.

Reference: Redux Essentials Part 8: RTK Query Advanced Patterns

2. Define Scope, Inferences, and Constraints

I established technical boundaries and inferences to ensure a focused implementation:

Scope Determination: Limited strictly to four files: apiSlice.js, store.js, PostsList.jsx, and AddPostForm.jsx. No extra endpoints, slices, or thunks.

Inferences: Inferred a standard RESTful structure for /api/posts (GET for list, POST for creation). Inferred a minimal folder structure: src/features/api/, src/features/posts/, and src/app/.

Constraints: Strictly No TypeScript. No manual useState for inputs in AddPostForm. Plain HTML inputs/labels only. Query must return a plain array (no transformResponse).

3. Strategy: Mock Backend for Decoupled Development

I decided to use json-server as the mock backend for its extreme simplicity.

Rationale: It provides a full fake REST API with zero coding (using a db.json file).

Verification: This allows us to validate that invalidatesTags actually triggers a refetch by observing real network traffic and testing automatic list refreshes without a finished backend.

4. Define the Full-Stack Contract (API & UX)

I established a "Contract-First" approach:

Data Contract: Neutral baseUrl: /api. Post fields must include id and title, with an optional body.

State Contract: Redux (RTK Query) handles server-state; React Hook Form handles ephemeral UI state.

UX Contract: Disable submit button during mutation isLoading. Clear inline error messages from formState.errors.

5. Design the Domain Model (Zod Schema)

I designed the domain model using Zod as the source of truth for validation:

Schema Specs: title (required, min 3, max 100) and body (optional, max 1000).

Implementation: Using zodResolver with useForm ensures that the UI logic is decoupled from the validation rules.

6. Construct the Data Pipeline (RTK Query API Slice)

I built the apiSlice.js using a "Tag-First" architecture.

Tags: providesTags: [{ type: 'Post', id: 'LIST' }] and invalidatesTags: [{ type: 'Post', id: 'LIST' }].

Logic: This ensures that when a post is added, the list query is automatically marked as stale and refetched by RTK Query.

7. Implement the Validation Layer (Resolver Integration)

I integrated @hookform/resolvers/zod. This ensures the AddPostForm is fully controlled by react-hook-form. We register inputs and display errors directly from the library's state, satisfying the constraint of avoiding manual input state management.

8. Execute the Mutation Strategy (.unwrap() Flow)

For the submission logic, I utilized the .unwrap() pattern.

Workflow: On submit, call the mutation -> unwrap() the result -> reset() the form on success.

Error Handling: Catch blocks handle console.error and UI feedback, keeping the component logic clean and idiomatic.

9. Optimize Component Rendering (Register-First Pattern)

The AddPostForm uses the register pattern to minimize re-renders. PostsList is designed to destructure data, isLoading, and isError directly from the hook for a clean, declarative UI that maps over the plain array.

10. Configure Environment & Verification (Vite & Vitest)

I scaffolded the project for a Vite-based environment.

Verification: Verified that the store only includes the API reducer and middleware. Manual testing ensures the form blocks invalid data and the list updates automatically upon successful submission.

Link: Vite Guide: Getting Started

Link: Vitest: Blazing Fast Unit Test Framework

Trajectory Transferability Notes (New Build)

This trajectory follows the Full-Stack Development build path:

Audit: Focuses on functional requirements and scaling needs (avoiding manual state).

Contract: Establishes API, UX, and strict constraints (No TS, No manual refetch).

Data Model: Scaffolds the domain model (Zod) as the source for validation.

Pipeline: Shapes the API with tag invalidation and mock-verified (json-server) data flow.

Verification: Uses deterministic logic (.unwrap()) and automated triggers to ensure the system behaves as expected.

Core Principle:
Audit Requirements → Define Contract → Design Model → Execute Pipeline → Verify Results.
# Implementation Trajectory: RTK Query + React Hook Form + Zod Integration


## Overview
This document outlines the systematic thought process and step-by-step approach for extending a minimal RTK Query demo to showcase modern, validated form submission using react-hook-form and Zod. The primary goal is to demonstrate a clean, production-ready pattern for integrating performant form management, declarative client-side validation, and cache-aware mutation handling in a minimal React app. All requirements, constraints, and implementation steps are designed to ensure idiomatic code, automatic cache refresh, and robust user feedback, while keeping the solution as simple and maintainable as possible.

---

## Requirements and Constraints

- Use createApi and fetchBaseQuery with one query (get posts list, plain array return) and one mutation (add post).
- Cache tags: providesTags: [{ type: 'Post', id: 'LIST' }] and invalidatesTags: [{ type: 'Post', id: 'LIST' }].
- Export only useGetPostsQuery and useAddPostMutation.
- Minimal store (reducer + middleware only).
- Two tiny components:
	- PostsList: show list with loading/error states, use data?.map(...).
	- AddPostForm: use react-hook-form + Zod for form handling and validation.
- Zod schema: title required (min 3 chars, max 100), body optional (max 1000 chars).
- Use zodResolver with useForm. Register inputs, display inline errors from formState.errors.
- On submit: call mutation with .unwrap(), reset form on success, handle errors (console.error + optional UI feedback).
- Disable submit button during mutation isLoading.
- No manual useState for inputs in AddPostForm (fully controlled by react-hook-form).
- Keep components minimal (plain HTML inputs, labels, error messages).
- No TypeScript, no extra endpoints/slices/reducers/thunks, no manual refetch.
- Query returns plain array (no transformResponse).
- PostsList destructures data, isLoading, isError.
- Neutral baseUrl: /api.
- Post fields: at least id and title; optional body.
- Valid for Vite with required packages installed.

---

## Thought Process

### 1. Understand the Prompt and Context

- Role: Expert React developer, specializing in RTK Query, modern form handling, and type-safe validation.
- Task: Extend the minimal RTK Query demo (Redux Essentials Part 8) by upgrading AddPostForm to use react-hook-form and Zod.
- Objective: Demonstrate a clean, production-ready pattern for validated form submission, cache-aware mutation, and minimal, idiomatic code.

### 2. Categorize and Extract Requirements

- Use createApi and fetchBaseQuery with:
	- One query (get posts list, returns plain array).
	- One mutation (add post).
- Use cache tags:
	- providesTags: [{ type: 'Post', id: 'LIST' }]
	- invalidatesTags: [{ type: 'Post', id: 'LIST' }]
- Export only useGetPostsQuery and useAddPostMutation.
- Minimal Redux store (only reducer + middleware).
- Two components:
	- PostsList: Show list, loading/error states, use data?.map(...).
	- AddPostForm: Use react-hook-form + Zod for form handling and validation.
- Zod schema:
	- title: required, min 3, max 100 chars.
	- body: optional, max 1000 chars.
- Use zodResolver with useForm.
- Register inputs, display inline errors from formState.errors.
- On submit:
	- Call mutation with .unwrap().
	- Reset form on success.
	- Handle errors (console.error + optional UI feedback).
- Disable submit button during mutation isLoading.
- No manual useState for inputs in AddPostForm (fully controlled by react-hook-form).
- Minimal UI (plain HTML inputs, labels, error messages).

#### Constraints

- No TypeScript (explicitly stated in prompt).
- No extra endpoints, slices, reducers, thunks, or manual refetch.
- Query returns plain array (no transformResponse).
- PostsList destructures data, isLoading, isError.
- Neutral baseUrl: /api.
- Post fields: at least id and title; optional body.

### 3. Clarify Assumptions and Project Setup

- Packages: Required: @reduxjs/toolkit, react-redux, react-hook-form, zod, @hookform/resolvers.
- API Backend: Assumes /api/posts endpoints exist for GET and POST. For demo or local development, a mock service (such as MSW or json-server) could be used.

### 4. Define Scope

- Only: RTK Query API slice, minimal Redux store, PostsList, AddPostForm.
- No: Extra Redux logic, manual state for form inputs, additional endpoints, or TypeScript.
- UI: Minimal, functional, with inline error feedback.
- API: Code assumes /api/posts endpoints exist. If not, set up a mock API or backend for testing.

### 5. Infer Folder Structure from File Paths

```
src/
	features/
		api/
			apiSlice.js
		posts/
			PostsList.jsx
			AddPostForm.jsx
	app/
		store.js
```

---

## To-Do List

1. apiSlice.js
	 - Set up RTK Query API with one query and one mutation.
	 - Add cache tags.
	 - Export only required hooks.
2. store.js
	 - Configure Redux store with only RTK Query reducer and middleware.
3. PostsList.jsx
	 - Use useGetPostsQuery.
	 - Display posts, handle loading and error states.
4. AddPostForm.jsx
	 - Set up react-hook-form with Zod validation.
	 - Register inputs, show inline errors.
	 - On submit, call mutation, reset form, handle errors.
	 - Disable submit during mutation loading.

---

## Summary of Approach

- Start by understanding the official RTK Query demo structure.
- Layer in react-hook-form and Zod for modern, validated form handling.
- Ensure cache tags are used for automatic list refresh.
- Keep everything minimal, idiomatic, and in JavaScript.
- Deliver four files as specified, each focused and clean.
- Note: The code assumes /api/posts endpoints exist. If not, set up a mock API or backend for testing.

---

## Minimal Folder Structure with Mock Backend

If you add a mock backend (for example, using json-server), the minimal folder structure would look like:

```
project-root/
	src/
		features/
			api/
				apiSlice.js
			posts/
				PostsList.jsx
				AddPostForm.jsx
		app/
			store.js
	db.json              # <-- Mock database for json-server
	package.json
	...other config files...
```

- db.json is the minimal file needed for json-server to serve /api/posts endpoints.
- No extra backend code is required; json-server can be run with a simple script.
- All frontend code remains in src/ as before.

Note: If using another mock solution (like MSW), you might add a src/mocks/ folder for handlers, but for pure json-server, only db.json is needed at the root.
# AI Refactoring Trajectory: RTK Query + React Hook Form + Zod Integration

## Overview
This trajectory is based on the detailed thought process documented in [prompt.md](../prompt.md), which outlines requirements, constraints, and step-by-step reasoning for extending the minimal RTK Query demo with react-hook-form and Zod validation. All implementation decisions and validation steps below are derived from that process.

---

## Phase 1: Understanding and Extracting Requirements

- **Reference:** See [prompt.md](../prompt.md) for full context and rationale.
- **Key Requirements:**
	- Use RTK Query (`createApi`, `fetchBaseQuery`) with one query (get posts list, plain array) and one mutation (add post).
	- Use cache tags: `providesTags: [{ type: 'Post', id: 'LIST' }]`, `invalidatesTags: [{ type: 'Post', id: 'LIST' }]`.
	- Export only `useGetPostsQuery` and `useAddPostMutation`.
	- Minimal Redux store (reducer + middleware only).
	- Two components: `PostsList` (shows list, loading/error states), `AddPostForm` (react-hook-form + Zod validation).
	- Zod schema: title required (min 3, max 100), body optional (max 1000).
	- Use `zodResolver` with `useForm`. Register inputs, display inline errors.
	- On submit: mutation `.unwrap()`, reset form on success, handle errors, disable submit during mutation loading.
	- No manual `useState` for inputs in AddPostForm.
	- Minimal UI (plain HTML inputs, labels, error messages).
	- No TypeScript, no extra endpoints/slices/reducers/thunks, no manual refetch.
	- Query returns plain array, neutral `baseUrl: /api`, post fields: at least id and title, optional body.

---

## Phase 2: Planning and Setup

- **Folder Structure:**
	- `src/features/api/apiSlice.js`
	- `src/app/store.js`
	- `src/features/posts/PostsList.jsx`
	- `src/features/posts/AddPostForm.jsx`
- **Dependencies:** Ensure installation of `@reduxjs/toolkit`, `react-redux`, `react-hook-form`, `zod`, `@hookform/resolvers`.
- **API Assumption:** `/api/posts` endpoints exist for GET and POST (mock backend if needed).

---

## Phase 3: Implementation Steps (as derived from prompt.md)

1. **apiSlice.js**
	 - Set up RTK Query API with one query and one mutation.
	 - Add cache tags.
	 - Export only required hooks.
2. **store.js**
	 - Configure Redux store with only RTK Query reducer and middleware.
3. **PostsList.jsx**
	 - Use `useGetPostsQuery`.
	 - Display posts, handle loading and error states.
4. **AddPostForm.jsx**
	 - Set up react-hook-form with Zod validation.
	 - Register inputs, show inline errors.
	 - On submit, call mutation, reset form, handle errors.
	 - Disable submit during mutation loading.

---

## Phase 4: Validation and Testing

- **Manual Review:**
	- Check each file for adherence to requirements and idiomatic patterns.
	- Ensure no extra endpoints, slices, reducers, thunks, or manual refetch.
	- Confirm query returns plain array, cache tags are correct, and form is fully controlled by react-hook-form.
- **Run and Test:**
	- Start dev server (`npm run dev`).
	- Test form validation, mutation, cache refresh, loading/error states.
	- Confirm posts list updates automatically after adding a post.

---

## Phase 5: Reflection and Documentation

- **Success Factors:**
	- All requirements from prompt.md met.
	- Minimal, idiomatic, validated form submission with RTK Query mutation and cache refresh.
	- No TypeScript, no extra Redux logic, minimal UI.
	- Code is clean, maintainable, and demonstrates best practices for modern React apps.
- **Pitfalls Avoided:**
	- No manual state for form inputs.
	- No unnecessary Redux logic or endpoints.
	- No over-engineering or deviation from prompt.md.

---

## Summary Checklist
- [x] Read and analyzed [prompt.md](../prompt.md)
- [x] Planned project structure and dependencies
- [x] Implemented RTK Query API slice
- [x] Configured minimal Redux store
- [x] Created PostsList component
- [x] Created AddPostForm with react-hook-form + Zod
- [x] Validated code and ran manual tests
- [x] Documented trajectory for reproducibility

---

## Conclusion

This trajectory is a direct implementation of the expert thought process in [prompt.md](../prompt.md), ensuring reproducibility, maintainability, and alignment with modern best practices for React, RTK Query, react-hook-form, and Zod integration.

# AI Refactoring Trajectory: RTK Query + React Hook Form + Zod Integration

## Overview
This document outlines the step-by-step process for upgrading a minimal RTK Query demo to use react-hook-form and Zod for validated form submission, cache-aware mutation, and minimal, idiomatic code.

---

## Phase 1: Understanding the Task

**Step 1.1: Read the Problem Statement**
- Carefully read prompt.md.
- Extract requirements: RTK Query, react-hook-form, Zod, cache tags, minimal Redux store, no TypeScript, minimal UI.

**Step 1.2: Analyze Deliverables**
- Four files: src/features/api/apiSlice.js, src/app/store.js, src/features/posts/PostsList.jsx, src/features/posts/AddPostForm.jsx.

---

## Phase 2: Planning and Setup

**Step 2.1: Identify Project Structure**
- Confirm folder structure matches requirements.
- Ensure required packages: @reduxjs/toolkit, react-redux, react-hook-form, zod, @hookform/resolvers.

**Step 2.2: Break Down Requirements**
- RTK Query API slice: one query, one mutation, cache tags.
- Redux store: only api reducer and middleware.
- PostsList: display posts, handle loading/error states.
- AddPostForm: react-hook-form + Zod, inline errors, mutation, reset, loading state.

---

## Phase 3: Implementation

**Step 3.1: Create RTK Query API Slice**
- Use createApi and fetchBaseQuery.
- Define getPosts (query) and addPost (mutation).
- Set providesTags and invalidatesTags for cache.
- Export useGetPostsQuery and useAddPostMutation only.

**Step 3.2: Configure Redux Store**
- Use configureStore from @reduxjs/toolkit.
- Add api.reducer and api.middleware only.

**Step 3.3: Implement PostsList Component**
- Use useGetPostsQuery.
- Destructure data, isLoading, isError.
- Display posts with minimal UI.
- Handle loading and error states.

**Step 3.4: Implement AddPostForm Component**
- Define Zod schema: title required (min 3, max 100), body optional (max 1000).
- Use useForm with zodResolver.
- Register inputs, display inline errors from formState.errors.
- On submit: call mutation with .unwrap(), reset form on success, handle errors.
- Disable submit button during mutation isLoading.
- No manual useState for inputs.
- Minimal HTML inputs, labels, error messages.

---

## Phase 4: Validation

**Step 4.1: Manual Review**
- Check each file for adherence to requirements and idiomatic patterns.
- Ensure no extra endpoints, slices, reducers, thunks, or manual refetch.
- Confirm query returns plain array, cache tags are correct, and form is fully controlled by react-hook-form.

**Step 4.2: Run and Test**
- Start dev server (npm run dev).
- Test form validation, mutation, cache refresh, loading/error states.
- Confirm posts list updates automatically after adding a post.

---

## Phase 5: Reflection and Documentation

**Key Success Factors**
- Requirements fully met: minimal, idiomatic, validated form submission with RTK Query mutation and cache refresh.
- All constraints respected: no TypeScript, no extra Redux logic, minimal UI.
- Code is clean, maintainable, and demonstrates best practices for modern React apps.

**Common Pitfalls Avoided**
- No manual state for form inputs.
- No unnecessary Redux logic or endpoints.
- No over-engineering or deviation from prompt.

---

## Summary Checklist
- [x] Read and analyze prompt.md
- [x] Plan project structure and dependencies
- [x] Implement RTK Query API slice
- [x] Configure minimal Redux store
- [x] Create PostsList component
- [x] Create AddPostForm with react-hook-form + Zod
- [x] Validate code and run manual tests
- [x] Document trajectory for reproducibility

---

## Conclusion

This trajectory documents a systematic approach to integrating RTK Query, react-hook-form, and Zod in a minimal React demo, ensuring validated form submission, cache-aware mutation, and idiomatic code structure. By following these steps, the solution is reproducible, maintainable, and aligned with modern best practices.


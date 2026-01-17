## RTK Query + React Hook Form + Zod Demo

This project is a minimal, production-ready demo showcasing modern React patterns for data fetching, mutation, and validated form handling. It combines Redux Toolkit Query (RTK Query) for API state management, react-hook-form for performant form control, and Zod for declarative, type-safe validation. The demo is built with Vite for fast development and includes a mock backend using json-server.

## Features

- **RTK Query**: Efficient data fetching and mutation with automatic cache management.
- **React Hook Form**: Minimal, performant form state management with zero manual useState.
- **Zod Validation**: Declarative, client-side schema validation integrated via @hookform/resolvers/zod.
- **Automatic Cache Refresh**: Adding a post triggers cache invalidation and list refetch.
- **Inline Error Feedback**: Form validation errors and mutation errors are shown inline.
- **Minimal UI**: Clean, accessible HTML markup with no unnecessary complexity.
- **Mock API**: Uses json-server and db.json for local development.

## Project Structure

```
repository_after/rtkq-react-hook-form-zod-demo/
├── db.json                # Mock database for json-server
├── package.json           # Project dependencies and scripts
├── vite.config.js         # Vite configuration
├── public/                # Static assets
└── src/
	 ├── app/
	 │   └── store.js       # Redux store setup
	 └── features/
		  ├── api/
		  │   └── apiSlice.js    # RTK Query API slice
		  └── posts/
				├── AddPostForm.jsx    # Validated form component
				└── PostsList.jsx      # Posts list component
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)

### Installation

1. Clone the repository:
	```sh
	git clone <repo-url>
	cd rtkq-react-hook-form-zod-demo
	```
2. Install dependencies:
	```sh
	npm install
	```
3. Start the mock API server:
	```sh
	npm run server
	# Runs json-server at http://localhost:5174/api/posts
	```
4. Start the Vite development server:
	```sh
	npm run dev
	# App runs at http://localhost:5173
	```

## Usage

- **View Posts**: The posts list is fetched from `/api/posts` using RTK Query. Loading and error states are handled automatically.
- **Add Post**: Use the form to add a new post. Title is required (3-100 chars), body is optional (max 1000 chars). Validation errors are shown inline. On successful submit, the form resets and the posts list updates automatically.

## API Endpoints

- `GET /api/posts` — Returns an array of posts.
- `POST /api/posts` — Adds a new post (expects `{ title, body }`).

## Key Technologies

- [Redux Toolkit Query](https://redux-toolkit.js.org/rtk-query/overview)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [@hookform/resolvers](https://react-hook-form.com/docs/useform#resolver)
- [Vite](https://vitejs.dev/)
- [json-server](https://github.com/typicode/json-server)

## Architecture & Patterns

- **API Slice**: Defined in `src/features/api/apiSlice.js` using `createApi` and `fetchBaseQuery`. Only one query (`getPosts`) and one mutation (`addPost`) are exposed. Cache tags ensure automatic list refresh.
- **Store**: Minimal Redux store in `src/app/store.js` with only the API reducer and middleware.
- **PostsList**: Uses `useGetPostsQuery` to fetch and display posts, handling loading and error states.
- **AddPostForm**: Uses `react-hook-form` and Zod for validated form submission. No manual useState for inputs. On submit, mutation is called with `.unwrap()`, form resets on success, and errors are handled inline.

## Customization

- To change the API base URL, set the `VITE_API_BASE_URL` environment variable in a `.env` file or your shell.
- To modify the mock data, edit `db.json`.

## Testing & Linting

- Run linter:
  ```sh
  npm run lint
  ```
- (Add your own tests in the `tests/` directory if desired.)

## License

MIT

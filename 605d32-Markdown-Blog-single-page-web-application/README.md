# Markdown Blog SPA (TypeScript, no frameworks)

## Problem Statement
Build a personal blog single-page application (SPA) where **all content is driven by Markdown** (no hardcoded blog content in `index.html`). The landing page must render the author profile from `content/author.md`, list blog posts from `content/blogs/*.md`, and allow navigating to individual post pages while rendering metadata (title/date/tags).

Reference instance: `instances/instance.json`  
Upstream dataset URL: `https://github.com/eaglepoint-ai/bd_dataset_001/tree/main/605d32-Markdown-Blog-single-page-web-application`

## Prompt Used
Deeply review the codebase, understand the logic, identify the issue (using official docs / updated solutions as needed), and fix it so the tests pass.

## Requirements Specified
- **No hardcoded content** in `repository_after/index.html`
- **TypeScript-only** source in `repository_after/src/` (no committed JS in `src/`)
- **No frameworks** (no React/Vue/Angular/Svelte/etc.)
- **Markdown content exists**:
  - `repository_after/content/author.md`
  - `repository_after/content/blogs/*.md`
- **SPA behavior**:
  - the URL changes on navigation (hash-based routing is acceptable)
  - clicking a post link renders the post without full page reload
- **Dynamic content & metadata rendering**:
  - author name renders as an `h1` from Markdown
  - post title renders and metadata is present (`time` or `.metadata`)

## System workflow (how it works)
This is a minimal SPA (no framework) that loads Markdown at runtime and renders HTML into `#app`.

- **Static server**: `repository_after/server.py` serves `index.html`, `styles.css`, `dist/app.js`, and the Markdown under `content/`.
- **Bootstrap**: `repository_after/index.html` loads the JS bundle from `dist/app.js` and provides a single mount node: `#app`.
- **Runtime data loading**:
  - `loadAuthor()` fetches `/content/author.md`
  - `loadBlogPosts()` fetches `/content/blogs/post-1.md`, `/post-2.md`, ... until it stops finding files
- **Frontmatter + metadata**:
  - blog posts use YAML-ish frontmatter delimited by `---`
  - the parser supports both `\n` and `\r\n` line endings and normalizes `tags` into an array
- **Rendering**:
  - landing page renders author + blog previews (`article.blog-preview`)
  - post page renders `.blog-post` with a `time` element and `.metadata`
- **Routing (SPA)**:
  - hash-based routes: `#home` and `#post?id=<filename>`
  - `router.init()` renders the view based on the current hash

## Repository layout
- `repository_after/`: working app (TypeScript source + compiled `dist/`)
- `repository_before/`: baseline scaffold (expected to fail requirements)
- `tests/`: pytest + Selenium requirements tests
- `evaluation/`: evaluator that runs the test suite for before/after and writes a JSON report
- `evaluation/reports/`: generated evaluation outputs (gitignored)

## Commands

### Run the app (locally, without Docker)
From `repository_after/`:

```bash
python3 server.py
```

Then open `http://localhost:8000`.

### Run the app (Docker, real-time in browser)
From the project root (the folder that contains `docker-compose.yml`):

```bash
docker-compose build web
docker-compose up web
```

Then open `http://localhost:8000`.

Notes:
- The server uses Python `SimpleHTTPRequestHandler` and is configured to be quiet, so you may see **no logs** while it runs.
- Stop with `Ctrl+C`.

### Build the browser bundle (locally)
From `repository_after/`:

```bash
npm install
npm run build
```

### Run tests on `repository_after` (Docker)
From the project root:

```bash
docker-compose build app
docker-compose run --rm -e TEST_REPO=/app/repository_after app pytest -v tests
```

Note: `app` is a test runner service (`command: pytest ...`). It is not meant to serve the website.

### Run tests on `repository_before` (Docker)
From the project root:

```bash
docker-compose build app
docker-compose run --rm -e TEST_REPO=/app/repository_before app pytest -v tests
```

### Run evaluation and generate reports (Docker)
The evaluator writes reports in this structure:

```
evaluation/
└── reports/
    └── YYYY-MM-DD/
        └── HH-MM-SS/
            └── report.json
```

- Only `report.json` should be present inside each timestamp folder.
- The reports output is gitignored via `.gitignore` (`evaluation/reports/**/report.json`).

If you run with `--rm` and no volume, the report is created in the container and removed with it.
To persist reports on your host, mount `evaluation/reports`:

```bash
mkdir -p evaluation/reports
docker-compose build app
docker-compose run --rm \
  -v "$(pwd)/evaluation/reports:/app/evaluation/reports" \
  app python3 /app/evaluation/evaluation.py
```

### Notes about Docker workflow
- The Compose setup intentionally does **not** mount the workspace by default (to avoid hiding built artifacts like `repository_after/dist/`).
- If you change TypeScript source, run `docker-compose build app` again so the updated bundle is rebuilt into the image.

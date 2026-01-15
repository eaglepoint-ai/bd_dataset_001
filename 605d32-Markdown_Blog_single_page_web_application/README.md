## Markdown Blog SPA (TypeScript, no frameworks)

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
This is a minimal SPA (no framework) that **fetches Markdown at runtime** and renders HTML into a single `<div id="app"></div>`.

### What happens when you open the website
1. `repository_after/server.py` serves `repository_after/index.html`.
2. `index.html` loads the browser bundle: `dist/app.js`.
3. The app fetches Markdown files:
   - `/content/author.md` for the landing page author section
   - `/content/blogs/post-1.md`, `/post-2.md`, ... for blog posts
4. Each blog post file contains frontmatter (between `---`) with `title`, `date`, and `tags`.
5. The app renders:
   - **Home**: author name (`h1`) + blog previews (`article.blog-preview` with links)
   - **Post page**: `.blog-post` with a `time` element and `.metadata`
6. Navigation is **SPA-style** using hash routes:
   - `#home`
   - `#post?id=post-1.md`

### Key folders/files
- `repository_after/content/author.md`: author profile Markdown
- `repository_after/content/blogs/*.md`: blog post Markdown (with frontmatter)
- `repository_after/src/*`: TypeScript source
- `repository_after/dist/app.js`: bundled browser JS (built by `npm run build`)
- `repository_after/server.py`: static HTTP server for local runs

## Repository layout
- `repository_after/`: working app (TypeScript source + compiled `dist/`)
- `repository_before/`: baseline scaffold (expected to fail requirements)
- `tests/`: pytest + Selenium requirements tests
- `evaluation/`: evaluator that runs the test suite for before/after and writes a JSON report
- `evaluation/reports/`: generated evaluation outputs (gitignored)

Note: this dataset mirror includes the built browser bundle under `repository_after/dist/`. Depending on how the sample was packaged, some “authoring-time” assets (like `src/`, `content/`, or `index.html`) may not be present in this snapshot even if they are part of the intended task spec.

## Commands

### A) Run the app locally (fastest for real-time browser checking)
From the project root:

```bash
cd repository_after
python3 server.py
```

Open in your browser:
- `http://localhost:8000`

What to check in the browser:
- Home page shows **author name** as an `h1`
- Home page shows **blog post links**
- Clicking a post changes the URL to `#post?...` and renders **title + metadata (date/tags)**

### Run the app (Docker, real-time in browser)
From the project root (the folder that contains `docker-compose.yml`):

```bash
docker-compose build web
docker-compose up web
```

Open in your browser:
- `http://localhost:8000`

Notes:
- The server is configured to be quiet, so you may see **no logs** while it runs (this is normal).
- Stop with `Ctrl+C`.

### Build the browser bundle (TypeScript → `dist/app.js`)
From the project root:

```bash
cd repository_after
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
The evaluator runs the full before/after comparison and writes reports in this structure:

```
evaluation/
└── reports/
    └── YYYY-MM-DD/
        └── HH-MM-SS/
            └── report.json
```

- Only `report.json` should be present inside each timestamp folder.
- The reports output is gitignored via `.gitignore` (`evaluation/reports/**/report.json`).

Run evaluation inside Docker (reports persisted to your host via the `evaluation` service volume):

```bash
docker-compose build evaluation
docker-compose run --rm evaluation
```

### Notes about Docker workflow
- Compose mounts this task folder into `/app` (same pattern as the Rate Limiter sample), so evaluation artifacts and edits are reflected on your host.
- If you change TypeScript source, re-build the browser bundle into `repository_after/dist/app.js` before running Docker tests/evaluation.

## Trajectory template (Audit → Contract → Design → Execute → Verify)

The reusable trajectory template (with transferability notes) lives in `trajectory/trajectory.md`. It keeps the structure constant:

- **Audit** → **Contract** → **Design** → **Execute** → **Verify**

## PATCH (ground-truth diff) conventions

### What is `git diff` and why do we use it?

`git diff` shows the differences between two states of code. In this dataset, we use it to generate the ground-truth `.patch` representing the minimal correct change between:

- `repository_before/` (starting state)
- `repository_after/` (solved state)

### Command to generate a patch

Run this from the project root:

```bash
git diff --no-index repository_before repository_after > patches/task_001.patch
```

## Evaluation guide (trainer & evaluator standard)

This repository includes an evaluator at `evaluation/evaluation.py` that runs the tests against both repos and writes a JSON report under `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`.

For dataset-wide consistency, evaluators should follow this contract unless a task overrides it:

- **Purpose**
  - Produce comparable before/after evaluations
  - Emit a machine-readable JSON report with a stable schema
- **Required repository structure**
  - `repository_before/`
  - `repository_after/`
  - `tests/`
  - `evaluation/evaluation.py`
  - `evaluation/reports/`
- **What `evaluation.py` must do**
  - Collect run metadata (timestamps, environment)
  - Run correctness tests on *before* and *after*
  - Optionally collect task metrics (numeric/boolean only)
  - Compare results and write `report.json`
  - Exit with `0` on success and `1` on failure
- **Required Python API**
  - `run_evaluation() -> dict`
  - `main() -> int`
  - end with:
    - `if __name__ == "__main__": sys.exit(main())`
- **Default success gate**
  - `success = after.tests.passed == true` (metrics do not decide success by default)
- **Metrics standard**
  - Optional, but if present must be JSON-serializable and **numbers/booleans only**
  - Use the same measurement logic for *before* and *after*
  - Avoid randomness without fixed seeds; avoid network calls/external services
- **Canonical report schema** (`report.json`)

```json
{
  "run_id": "uuid",
  "started_at": "ISO-8601",
  "finished_at": "ISO-8601",
  "duration_seconds": 0.0,
  "environment": {
    "python_version": "3.x",
    "platform": "os-arch"
  },
  "before": {
    "tests": {
      "passed": false,
      "return_code": 1,
      "output": "pytest output (truncated)"
    },
    "metrics": {}
  },
  "after": {
    "tests": {
      "passed": true,
      "return_code": 0,
      "output": "pytest output (truncated)"
    },
    "metrics": {}
  },
  "comparison": {
    "passed_gate": true,
    "improvement_summary": "short human-readable summary"
  },
  "success": true,
  "error": null
}
```

- **Example metrics block**

```json
{
  "avg_time_ms": 310.8,
  "p95_time_ms": 520.4,
  "failures": 0,
  "failure_rate": 0.0,
  "deadlocks": 0,
  "ops_per_second": 128.7,
  "rows_processed": 10000,
  "warnings": 1
}
```

- **Recommended libraries (approved)**
  - Core: `os`, `sys`, `time`, `json`, `uuid`, `platform`, `subprocess`, `pathlib`, `datetime`
  - Testing: invoke `pytest` via `subprocess`
  - Optional (only if task requires): `psutil`, `sqlite3`, `sqlalchemy`
  - Avoid: network calls, external services, heavy frameworks
- **Error handling**
  - If evaluation crashes, set `success = false` and store a helpful message in `error`.

## Git (optional)
If you want to save your changes to Git:

```bash
git status
git add .
git commit -m "Fix markdown metadata parsing and add Docker web service"
```

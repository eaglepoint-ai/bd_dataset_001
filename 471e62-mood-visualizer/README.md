# MoodMorph - Mood Visualization App

A React app that transforms your mood into animated geometric shapes. Type how you feel, and watch it come to life as a colorful, moving shape.

## Quick Start

### Option 1: Local Development

```bash
cd repository_after
npm install
npm run dev
```

Open http://localhost:3000

### Option 2: Docker

```bash
# Build image
docker compose build

# Run tests (before - expected some failures)
docker compose run --rm app sh /usr/local/bin/run-tests-before.sh

# Run tests (after - expected all pass)
docker compose run --rm app sh /usr/local/bin/run-tests-after.sh

# Run evaluation (compares both implementations)
docker compose run --rm app python3 evaluation/evaluation.py
```

This will:
- Run tests for both before and after implementations
- Run structure and equivalence tests
- Generate a report at `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`

## Requirements

All 4 requirements are implemented and tested:

1. ✅ **Save moods locally** - Uses LocalStorage
2. ✅ **Canvas animations** - 5 animation types (rotate, pulse, bounce, wave, jitter)
3. ✅ **Empty input shows error** - Validates before submission
4. ✅ **Randomized shapes always valid** - Mathematically guaranteed

## Running Tests

```bash
cd repository_after
npm test
```

**Result:** 66 tests, all passing ✅

## Project Structure

```
repository_after/
├── src/
│   ├── lib/              # Core logic (moodToShape, storage, canvas)
│   ├── components/       # React components
│   ├── pages/            # HomePage, GalleryPage
│   └── __tests__/        # Test suite
```

## How It Works

1. User types a mood (e.g., "happy and excited")
2. Algorithm converts mood to shape properties (deterministic)
3. Canvas animates the shape with colors and motion
4. User can save to gallery (stored in LocalStorage)

## Tech Stack

- TypeScript + React 18
- Tailwind CSS
- Vite
- Jest + React Testing Library
- Canvas API for animations

## Evaluation

After running the evaluation, check the report:

```bash
# View the latest report
docker compose run --rm app cat evaluation/reports/latest.json

# View a specific timestamped report
docker compose run --rm app cat evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
```

Success means `"success": true` and all tests passed.

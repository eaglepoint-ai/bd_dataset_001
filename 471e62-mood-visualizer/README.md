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
# Run evaluation (tests + reports)
docker-compose up

# Run frontend dev server
docker-compose up frontend

# Run tests only
docker-compose up test
```

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

## Docker Services

- `evaluation` - Runs tests and generates reports
- `frontend` - Dev server (port 3000)
- `test` - Jest test suite
- `build` - Production build

## Evaluation

After running `docker-compose up`, check the report:

```bash
cat evaluation/reports/latest.json
```

Success means `"success": true` and all tests passed.

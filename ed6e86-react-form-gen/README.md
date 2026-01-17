# Form Builder - Next.js Application

This project contains a form builder application that was converted from vanilla HTML/JavaScript to a modern Next.js application with TypeScript and Tailwind CSS.

## What This Project Does

The application lets users create custom forms by adding different types of fields:
- Text inputs (regular text, email, phone, URL)
- Choice fields (radio buttons and checkboxes)
- Each field can have custom labels, placeholders, and be marked as required or optional

Users can build forms on one page, see a live preview, save forms to their browser, and view saved forms on another page.

## Getting Started

### Local Development

First, make sure you have Node.js installed (version 20 or higher).

**Install dependencies:**
```bash
cd repository_after
npm install
```

**Run the development server:**
```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser. You should see the home page with links to build forms and view saved forms.

**Run tests:**
```bash
npm test
```

**Check TypeScript types:**
```bash
npm run type-check
```

**Build for production:**
```bash
npm run build
npm start
```

### What to Expect

When you run `npm run dev`:
- The Next.js development server starts on port 3000
- You can navigate between pages using the header links
- The form builder lets you add fields and see a live preview
- Forms are saved to your browser's localStorage
- The view-form page loads and displays your saved forms

When you run tests:
- Type tests verify all TypeScript types are correct
- Storage tests verify localStorage saving and loading works
- All 15 tests should pass

When you run type-check:
- TypeScript compiler checks all files
- Should show no errors if everything is typed correctly

## Docker Setup

If you want to test everything in Docker (recommended for CI/CD), see the `DOCKER.md` file for all Docker commands.

The quick way to test everything:
```bash
docker compose run --rm app python evaluation/evaluation.py
```

This runs the full evaluation which:
- Verifies the original files exist
- Runs type checking
- Runs all tests
- Generates a report

## Project Structure

- `repository_before/` - The original HTML/JavaScript application
- `repository_after/` - The new Next.js application I built
- `evaluation/` - Scripts that test and evaluate the application
- `Dockerfile` and `docker-compose.yml` - Docker configuration

## What Was Done

I converted the entire application from vanilla JavaScript to Next.js while keeping all functionality:

1. **Converted to Next.js App Router** - Modern routing with the App Router
2. **Added TypeScript** - Full type safety with no `any` types
3. **Converted CSS to Tailwind** - All styling now uses Tailwind classes
4. **Maintained Color Scheme** - Kept the original colors (#00adba primary, #ff6b35 accent)
5. **Preserved Functionality** - Everything works exactly as before
6. **Added Tests** - Comprehensive test coverage for types and storage
7. **Made It Responsive** - Works well on mobile and desktop

The application is production-ready and passes all tests and type checks.

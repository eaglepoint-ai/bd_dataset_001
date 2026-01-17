# Bookstore CRUD Service Implementation

## Overview

This project demonstrates refactoring a proof-of-concept bookstore backend into a complete CRUD service using Rust and Actix Web 4.x. The implementation replaces inefficient Vec-based storage with a thread-safe `HashMap<Uuid, Book>` for O(1) lookups.

## Problem Statement

The original bookstore backend had critical issues:
- Books identified by title strings → collisions and impossible updates
- Vec storage with O(n) lookups → poor performance
- Missing CREATE, UPDATE, DELETE endpoints
- String error responses instead of proper HTTP status codes
- No input validation (accepted negative prices, empty fields)

## Solution

A complete CRUD service with:
- **UUID-based identification** for unique book IDs
- **HashMap storage** with `Arc<Mutex<>>` for thread-safe O(1) lookups
- **Full CRUD operations** (POST, GET, PATCH, DELETE)
- **Custom error type** implementing `ResponseError` for proper JSON errors
- **Input validation** (non-empty title/author, price > 0, stock >= 0)
- **Immutable field protection** (title and id cannot be modified via PATCH)

## Docker Commands

### Build the Docker image
```bash
docker build -t bookstore-eval .
```

### Run tests on repository_after
```bash
docker run --rm bookstore-eval bash -c "cd repository_after/bookstore_backend && cargo build --release && cargo test --release"
```

### Run evaluation (compares before vs after)
```bash
docker run --rm bookstore-eval python evaluation/evaluation.py
```

### Using Docker Compose
```bash
# Build
docker-compose build

# Run tests on after
docker-compose run --rm test-after

# Run evaluation
docker-compose run --rm evaluation
```

## API Endpoints

### CREATE - `POST /books`
```json
{
  "title": "The Rust Programming Language",
  "author": "Steve Klabnik",
  "price": 55.99,
  "stock": 100
}
```
- **Success**: `201 Created` with book JSON (includes generated UUID)
- **Error**: `400 Bad Request` with JSON error message

### READ ALL - `GET /books`
- **Success**: `200 OK` with array of books (empty array if none)

### READ ONE - `GET /books/{id}`
- **Success**: `200 OK` with book JSON
- **Error**: `404 Not Found`

### UPDATE - `PATCH /books/{id}`
```json
{
  "price": 49.99,
  "stock": 50
}
```
- Partial updates: `author`, `price`, `stock` only
- Cannot update `title` or `id` → `400 Bad Request`
- **Success**: `200 OK` with updated book
- **Error**: `404 Not Found` or `400 Bad Request`

### DELETE - `DELETE /books/{id}`
- **Success**: `204 No Content`
- **Error**: `404 Not Found`

## Validation Rules

| Field  | Rule |
|--------|------|
| title  | Non-empty (whitespace trimmed) |
| author | Non-empty (whitespace trimmed) |
| price  | Must be > 0 |
| stock  | Must be >= 0 |

## Technical Constraints

- **Language**: Rust 2021 edition
- **Framework**: Actix Web 4.x
- **Storage**: In-memory `Arc<Mutex<HashMap<Uuid, Book>>>`
- **UUID**: v4 generation via `uuid` crate
- **Serialization**: `serde` + `serde_json`

## Performance Targets

- Single CRUD operation: <5ms
- List 10,000 books: <100ms
- 100 concurrent requests: no timeouts or data corruption

## Project Structure

```
├── repository_before/      # Empty/broken state (before fix)
├── repository_after/       # Complete implementation (after fix)
│   └── bookstore_backend/
│       ├── Cargo.toml
│       └── src/
│           └── main.rs     # Full CRUD implementation
├── tests/
│   └── test_bookstore.py   # Python integration tests
├── evaluation/
│   └── evaluation.py       # Comparison script
├── instances/
│   └── instance.json       # Task metadata
├── trajectory/
│   └── trajectory.md       # Implementation reasoning
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Success Criteria

- ✅ HashMap provides O(1) ID lookups
- ✅ All validation rules enforced with specific error messages
- ✅ Concurrent requests don't corrupt data or panic
- ✅ Custom error type returns proper JSON + status codes
- ✅ Title field rejected on PATCH with clear error
- ✅ Tests demonstrate FAIL_TO_PASS pattern
## Prompt
You're a Senior Backend Engineer on a platform team. The current bookstore service is a proof-of-concept that is blocking frontend development. It only partially supports read/buy operations, has no CRUD functionality, and uses titles as identifiers, causing lookup failures and data collisions. Your task is to refactor the backend into a complete CRUD service in Rust using Actix Web with proper validation, error handling, and concurrency safety.

## Problem Statement
The existing bookstore backend is incomplete and inefficient. Books are identified solely by title, making updates impossible and leading to collisions, while `Vec` storage causes O(n) lookups with no indexing. There are no endpoints for creating, updating, or deleting books, error handling uses plain strings instead of proper HTTP status codes, and input validation is missing, allowing negative prices or empty fields.  

The objective is to refactor the backend into a full CRUD service using Rust and Actix Web, replacing the `Vec` with a thread-safe in-memory `HashMap` keyed by UUIDs to enable O(1) lookups. All endpoints must implement validation, proper HTTP status codes via a custom error type, and safe concurrent access. The service should perform efficiently under load and pass comprehensive tests demonstrating functional CRUD operations.  
> Existing code can be reused as a starting point—refactoring should focus on replacing `Vec` storage with `HashMap`, adding UUIDs, proper validation, and implementing all missing CRUD operations.

## Requirements

### CRUD Endpoints

1. **CREATE** `POST /books`  
   - Input: `title`, `author`, `price`, `stock`  
   - Validation: `title` and `author` non-empty, `price > 0`, `stock >= 0`  
   - Response: `201 Created` with book JSON  
   - Error: `400 Bad Request` with JSON error  

2. **READ ALL** `GET /books`  
   - Response: list of all books (empty array if none)  

3. **READ ONE** `GET /books/{id}`  
   - Response: book JSON  
   - Error: `404 Not Found`  

4. **UPDATE** `PATCH /books/{id}`  
   - Partial updates: `author`, `price`, `stock`  
   - Cannot update `title` or `id` → `400 Bad Request`  
   - Validation: `author` non-empty, `price > 0`, `stock >= 0`  
   - Response: `200 OK` with updated book  
   - Error: `404 Not Found`  

5. **DELETE** `DELETE /books/{id}`  
   - Response: `204 No Content`  
   - Error: `404 Not Found`  

### Constraints
- Rust + Actix Web 4.x only  
- In-memory storage: `Arc<Mutex<HashMap<Uuid, Book>>>`  
- Custom error type implementing `ResponseError`  
- Thread-safe for concurrent requests  
- Performance Targets:  
  - Single CRUD operation: <5ms  
  - List 10,000 books: <100ms  
  - 100 concurrent requests without timeouts  

### Success Criteria
- All CRUD operations work correctly with validation  
- `HashMap` provides O(1) lookups  
- Concurrent requests do not corrupt data  
- Proper HTTP status codes and JSON error responses  
- Tests demonstrate failure in the old implementation and success after refactoring  

## Tech Stack
- **Language:** Rust 2021 edition  
- **Web Framework:** Actix Web 4.x  
- **Data Storage:** In-memory `Arc<Mutex<HashMap<Uuid, Book>>>`  
- **UUID Generation:** `uuid` crate v4  
- **Serialization:** `serde`  
- **Testing:** Rust built-in tests with `cargo test` 
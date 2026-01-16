# Trajectory: Bookstore CRUD Service Implementation

## 1. Problem Analysis

### 1.1 Current State Issues
The existing bookstore backend has several critical flaws:

1. **No Unique Identifiers**: Books are identified by title strings, causing:
   - Impossible to update books (can't distinguish between books with same title)
   - Data collisions when multiple books share titles
   - O(n) lookup time for finding books

2. **Missing CRUD Operations**: Only partial read operations exist
   - No CREATE endpoint
   - No UPDATE endpoint  
   - No DELETE endpoint

3. **Poor Error Handling**:
   - String error responses instead of structured JSON
   - No proper HTTP status codes
   - No custom error type implementing `ResponseError`

4. **No Input Validation**:
   - Accepts negative prices
   - Accepts empty titles/authors
   - No constraints on stock values

5. **No Concurrency Safety**: Vec storage without proper synchronization

### 1.2 Requirements Extraction
From the prompt, I identified these must-have features:

| Requirement | Implementation |
|-------------|----------------|
| UUID-based IDs | `uuid` crate v4 with serde support |
| O(1) lookups | `HashMap<Uuid, Book>` instead of `Vec<Book>` |
| Thread safety | `Arc<Mutex<HashMap<...>>>` |
| Input validation | Custom validation functions |
| Proper HTTP codes | `ResponseError` trait implementation |
| Immutable title/id | Detect and reject on PATCH |
| Performance SLAs | <5ms CRUD, <100ms list 10k, 100 concurrent |

## 2. Design Decisions

### 2.1 Custom Error Type
I chose to implement a custom `ApiError` struct that:
- Implements `ResponseError` for Actix Web integration
- Returns JSON error responses with `message` field
- Carries status code internally
- Provides factory methods: `bad_request()`, `not_found()`

This approach was chosen over string errors because:
1. JSON responses are machine-parseable
2. Status codes are correct (400, 404, etc.)
3. Error handling is type-safe

### 2.2 UpdateBook Structure
For detecting immutable field updates, I used:
```rust
pub struct UpdateBook {
    pub title: Option<serde_json::Value>,  // Detect if sent
    pub id: Option<serde_json::Value>,     // Detect if sent
    pub author: Option<String>,
    pub price: Option<f64>,
    pub stock: Option<u32>,
}
```

Using `serde_json::Value` for title/id allows detecting when these fields are present in the request body, even if their values are null. This enables proper rejection of any attempt to modify immutable fields.

### 2.3 Validation Strategy
Validation is split into two functions:
- `validate_create_book()`: Full validation for all required fields
- `validate_update_book()`: Validates immutable field rejection + optional field constraints

Key validation rules:
- Title: Non-empty, trimmed (reject whitespace-only)
- Author: Non-empty, trimmed
- Price: Must be > 0 (not >= 0)
- Stock: >= 0 (u32 enforces this naturally)

### 2.4 Route Configuration
I changed from PUT to PATCH for updates because:
- PATCH is semantically correct for partial updates
- PUT implies full resource replacement
- The requirements specify "partial updates"

## 3. Implementation Steps

### Step 1: Update Cargo.toml
Added required dependencies:
- `actix-web = "4"` - Web framework
- `serde` with derive - Serialization
- `serde_json` - JSON parsing for UpdateBook
- `uuid` with v4 and serde features - ID generation
- `thiserror` - Error derivation

### Step 2: Implement ApiError
Created custom error type with:
- `ResponseError` trait implementation
- `error_response()` returning JSON
- Status code support (400, 404)

### Step 3: Update Models
- `Book`: Added UUID id field
- `CreateBook`: Input model without id
- `UpdateBook`: Partial update model with immutable field detection

### Step 4: Implement Handlers
Each handler follows the pattern:
1. Validate input (if applicable)
2. Lock the mutex
3. Perform operation
4. Return appropriate response

### Step 5: Add Tests
Comprehensive test coverage including:
- Happy path tests
- Validation error tests
- Not found tests
- Concurrency tests
- Performance tests

## 4. Testing Strategy

### 4.1 Rust Unit Tests
The main.rs includes integration tests using Actix's test utilities:
- `test::init_service()` for app setup
- `test::TestRequest` for building requests
- `test::call_service()` for execution

### 4.2 Python Integration Tests
Created `tests/test_bookstore.py` for external testing:
- Starts the actual server process
- Makes HTTP requests
- Validates responses
- Tests concurrency with ThreadPoolExecutor

### 4.3 FAIL_TO_PASS Pattern
Tests are designed to:
- **FAIL** on `repository_before`: No backend exists
- **PASS** on `repository_after`: Complete implementation

## 5. Performance Considerations

### 5.1 O(1) Lookups
HashMap provides constant-time lookups by UUID key, compared to O(n) Vec scanning.

### 5.2 Minimal Lock Contention
The mutex is held only during the operation, with no long-running operations inside the lock.

### 5.3 Clone Optimization
Books are cloned when returning from handlers to avoid holding the lock during serialization.

## 6. Concurrency Safety

The implementation ensures thread safety through:
1. `Arc` for shared ownership across handlers
2. `Mutex` for exclusive access during mutations
3. No panic paths that could poison the mutex
4. Short critical sections to minimize contention

## 7. Verification

### Build Command
```bash
cd repository_after/bookstore_backend
cargo build --release
```

### Test Command
```bash
cargo test --release
```

### Evaluation Command
```bash
python evaluation/evaluation.py
```

### Docker Commands
```bash
docker-compose build
docker-compose run evaluation
```

## 8. Resources Used

- [Actix Web Documentation](https://actix.rs/docs/)
- [Rust Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html)
- [UUID Crate Documentation](https://docs.rs/uuid/latest/uuid/)
- [Serde JSON](https://docs.rs/serde_json/latest/serde_json/)

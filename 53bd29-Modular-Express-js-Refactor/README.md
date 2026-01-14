# Modular Express.js Refactor

## Problem Statement

The task is to refactor a large, monolithic Express application consisting of over 1000 lines in a single `index.js` file into a clean, modular, and production-ready backend architecture. The refactor must reorganize the codebase into a scalable MVC-style structure by separating configuration, models, controllers, routes, and middleware, with one model/controller/route per feature while preserving all existing routes, behaviors, responses, and business logic exactly as they are.

Controllers should encapsulate application logic, routes should only map endpoints, and database, environment, and file upload configurations must be centralized. The final result should include robust async error handling, a minimal server entry point, and a maintainable Express + MongoDB codebase that starts correctly and functions identically to the original implementation.

## Prompt Used

```
Refactor the monolithic Express.js application in repository_before/index.js into a modular MVC architecture. 
Create separate directories for config, models, controllers, routes, and middleware. Extract each feature 
(authentication, posts, interactions, notifications, search, profile, upload, private chats, bots, community) 
into its own model, controller, and route file. Centralize database connection, environment variables, and 
file upload configuration. Add async error handling middleware. Keep the main index.js minimal (just server 
start and route mounting). Use CommonJS (require/module.exports). Preserve all routes, endpoints, business 
logic, and behavior exactly as in the original.
```

## Requirements

1. ✅ Separate config, models, controllers, routes, and middleware
2. ✅ One model/controller/route per feature
3. ✅ Controllers handle logic, routes only map endpoints
4. ✅ Centralized DB, env, and upload config
5. ✅ Use CommonJS imports (require/module.exports)
6. ✅ Preserve all routes, paths, responses, and logic
7. ✅ Add proper async error handling
8. ✅ Keep entry index.js minimal (server start + DB connect)
9. ✅ App must start and all existing endpoints must work identically

## Structure

```
repository_before/          # Monolithic 938-line index.js
repository_after/           # Modular MVC architecture (32 files)
├── config/                 # Centralized configuration
│   ├── database.js         # MongoDB connection
│   ├── environment.js      # Environment variables
│   └── upload.js           # Multer file upload config
├── models/                 # Mongoose models (8 files)
│   ├── Account.js
│   ├── Post.js
│   ├── Comment.js
│   ├── Community.js
│   ├── CommunityChat.js
│   ├── PrivateChat.js
│   ├── Notification.js
│   └── Bot.js
├── controllers/            # Business logic (10 files)
│   ├── authController.js
│   ├── postsController.js
│   ├── interactionsController.js
│   ├── notificationsController.js
│   ├── searchController.js
│   ├── profileController.js
│   ├── uploadController.js
│   ├── privateChatsController.js
│   ├── botsController.js
│   └── communityController.js
├── routes/                 # Route definitions (10 files)
│   ├── authRoutes.js
│   ├── postsRoutes.js
│   ├── interactionsRoutes.js
│   ├── notificationsRoutes.js
│   ├── searchRoutes.js
│   ├── profileRoutes.js
│   ├── uploadRoutes.js
│   ├── privateChatsRoutes.js
│   ├── botsRoutes.js
│   └── communityRoutes.js
├── middleware/             # Async error handler
│   └── asyncHandler.js
└── index.js                # Minimal entry point (49 lines)
tests/                      # Jest test suite (JavaScript)
├── test_structure.test.js  # Structure validation tests
└── test_equivalence.test.js # Behavior equivalence tests
evaluation/                 # Evaluation script (JavaScript)
├── evaluation.js           # Automated evaluation
└── reports/                # Timestamped JSON reports
instances/                  # Problem instance definition
patches/                    # Diff between before/after
trajectory/                 # Implementation notes
```

## Commands (Docker Only)

### Setup

#### Build the Image

```bash
docker-compose build
```

#### Run Tests Individually

```bash
# Test repository_before (should fail - no modular structure)
docker-compose run --rm test-before

# Test repository_after (should pass - has modular structure)
docker-compose run --rm test-after
```

#### Run Evaluation (Recommended)

This runs tests on both repository_before (should FAIL) and repository_after (should PASS):

```bash
docker-compose run --rm evaluation
```

#### Run Applications

```bash
# Start MongoDB
docker-compose up -d mongo

# Run before version (port 7000)
docker-compose up app-before

# Run after version (port 7001)
docker-compose up app-after
```

#### Stop Services

```bash
docker-compose down
```

## Results

### Evaluation Output (Docker)

When you run `docker-compose run --rm evaluation`, you'll see:

```
============================================================
Express.js Modular Refactor Evaluation
============================================================

[1/5] Analyzing repository_before structure...
  - Index.js lines: 938
  - Modular structure: false
  - Total modular files: 0

[2/5] Analyzing repository_after structure...
  - Index.js lines: 49
  - Modular structure: true
  - Config files: 3
  - Model files: 8
  - Controller files: 10
  - Route files: 10
  - Middleware files: 1
  - Total modular files: 32

[3/5] Running tests on repository_before (expected to FAIL)...
  ✗ Success: false (no modular structure)

[4/5] Running tests on repository_after (expected to PASS)...
  ✓ Success: true (has modular structure)

[5/5] Generating report...

Improvements:
  - Index.js reduced by 889 lines (95%)
  - Created 32 modular files
  - Structure improved: true
  - Index is minimal: true

Report saved to: evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
```

### Metrics

**Before (Monolithic):**
- 1 file: 938 lines
- No modular structure
- No separation of concerns

**After (Modular):**
- 32 modular files
- 3 config files
- 8 model files
- 10 controller files
- 10 route files
- 1 middleware file
- index.js: 49 lines (95% reduction)

### Improvements

- ✅ Clean MVC architecture
- ✅ 95% reduction in main file size
- ✅ Separation of concerns
- ✅ Maintainable and scalable
- ✅ Robust error handling
- ✅ Centralized configuration
- ✅ Production-ready code
- ✅ All functionality preserved

## Documentation

- See `trajectory/trajectory.md` for detailed implementation notes
- See `repository_after/README.md` for API documentation
- See `patches/diff.patch` for complete diff

## Testing Endpoints in Browser

### Start the Application

First, start MongoDB and the application using Docker:

```bash
# Start MongoDB
docker-compose up -d mongo

# Start the AFTER version (modular - port 7001)
docker-compose up app-after

# OR start the BEFORE version (monolithic - port 7000)
docker-compose up app-before
```

### Test Endpoints

Once the server is running, open your browser and test these endpoints:

#### Root Endpoint
```
http://localhost:7001/philomena/
```
Expected: `Welcome to Philomena API dev`

#### Authentication Endpoints
```
http://localhost:7001/philomena/authentication/
```
Expected: `Welcome to the authentication route`

#### Posts Endpoints
```
http://localhost:7001/philomena/posts/
```
Expected: `Welcome to the posts route`

```
http://localhost:7001/philomena/posts/getAllPosts
```
Expected: JSON array of all posts (empty array if no data)

#### Profile Endpoints
```
http://localhost:7001/philomena/profile/
```
Expected: `Welcome Profile Route`

```
http://localhost:7001/philomena/profile/getAllProfiles/
```
Expected: JSON array of all profiles

#### Search Endpoint
```
http://localhost:7001/philomena/search/test
```
Expected: JSON object with search results for "test"

#### Community Endpoints
```
http://localhost:7001/philomena/community/
```
Expected: `Welcome to Community Route`

```
http://localhost:7001/philomena/community/discoverCommunities
```
Expected: JSON array of public communities

### Using Browser Developer Tools

For POST requests, you can use the browser's Developer Console:

```javascript
// Example: Create a new post
fetch('http://localhost:7001/philomena/posts/newPost', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fullname: 'Test User',
    username: 'testuser',
    content: 'This is a test post',
    tags: ['test']
  })
})
.then(response => response.text())
.then(data => console.log(data));

// Example: Login
fetch('http://localhost:7001/philomena/authentication/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Using cURL

You can also test with cURL from the terminal:

```bash
# Test root endpoint
curl http://localhost:7001/philomena/

# Test GET endpoint
curl http://localhost:7001/philomena/posts/getAllPosts

# Test POST endpoint
curl -X POST http://localhost:7001/philomena/authentication/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Doe",
    "username": "johndoe",
    "password": "secret123"
  }'
```

### Port Numbers

- **repository_before** (monolithic): `http://localhost:7000`
- **repository_after** (modular): `http://localhost:7001`

Both versions have identical endpoints and functionality!

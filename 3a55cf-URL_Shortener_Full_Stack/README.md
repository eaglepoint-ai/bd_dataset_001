# URL Shortener - Full Stack Challenge

**Task Type:** Full Stack Feature Development  
**Difficulty:** Medium  
**Languages:** JavaScript (Node.js + React with Vite)  
**Tests:** 33 independent test cases

## Overview

Build a production-ready URL shortener with custom short code support, click tracking, and a modern React frontend.


## Tech Stack

- **Frontend:** React with Vite (functional components only)
- **Backend:** Node.js with Express
- **Database:** SQLite with better-sqlite3 (raw SQL, no ORM)
- **No authentication required**

## Core Features

1. Submit long URL → receive shortened URL
2. Optional custom short code (auto-generate if not provided)
3. Short URL redirects to original URL
4. Track click count per URL
5. Display all URLs with stats in table

## Custom Short Code Rules

- Optional (auto-generate 6-char alphanumeric if empty)
- Length: 4-20 characters
- Allowed: letters, numbers, hyphens only
- Reserved words: api, admin, static, health, urls, http, https
- Must be unique (error if taken)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/urls | Create short URL |
| GET | /api/urls | List all URLs |
| GET | /api/urls/:id | Get URL by ID |
| DELETE | /api/urls/:id | Delete URL |
| GET | /:code | Redirect to original |

## Error Codes

| Code | Description |
|------|-------------|
| INVALID_URL | URL format is invalid |
| INVALID_CODE | Custom code format invalid |
| DUPLICATE_CODE | Code already taken |
| RESERVED_CODE | Code is reserved word |
| NOT_FOUND | URL not found |

## Running the Application

### Server
```bash
cd repository_after/server
npm install
npm start
# Server runs on http://localhost:3001
```

### Client
```bash
cd repository_after/client
npm install
npm run dev
# Client runs on http://localhost:5173
```

## Verification Steps

1. ✅ Create URL without custom code → redirect works
2. ✅ Create URL with "my-link" → /my-link redirects
3. ✅ Try "my-link" again → error shown, first one preserved
4. ✅ Try "admin" → reserved word error
5. ✅ Try "ab" → too short error
6. ✅ Click redirect 3x → count shows 3
7. ✅ Restart server → data persists

## Docker Setup

```bash
docker build -t url-shortener .
docker run --rm url-shortener sh ./run_after.sh
```

## Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Docker** (optional): >= 20.10

## License

MIT License - ByteDance Training Project

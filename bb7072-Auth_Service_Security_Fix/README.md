# Node.js Authentication Service Security Fix

## Problem Statement
A Node.js authentication service has multiple security vulnerabilities that expose user data and allow unauthorized access. The service handles user registration, login, JWT token management, and password reset. Security audit revealed critical issues including weak password hashing, token verification bypass, and session management flaws. Fix all security vulnerabilities to make the service production-ready.

## Prompt
Fix the authentication service that has multiple security vulnerabilities including weak password hashing, timing attack exposure, session fixation, JWT verification bypass, predictable reset tokens, and missing brute force protection. The fixed implementation should follow security best practices while maintaining the same API interface.

## Requirements
1. Fix weak password hashing - replace MD5 with bcrypt using cost factor 12
2. Fix timing attack vulnerability - use crypto.timingSafeEqual() or bcrypt.compare for hash comparison
3. Fix session fixation - regenerate session ID after successful login using session.regenerate()
4. Fix JWT verification - use jwt.verify() with explicit algorithm ['HS256'] instead of jwt.decode()
5. Fix predictable reset tokens - use crypto.randomBytes(32) for cryptographically secure tokens
6. Add rate limiting - track failed login attempts per email and lock account after 5 failures within 15 minutes

## Category
Security Fix

## Commands
```bash
docker-compose run --rm run_before
```


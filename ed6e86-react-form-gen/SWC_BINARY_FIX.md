# Next.js SWC Binary Issue - Fix Explanation

## Problem

The evaluation was failing with this error:
```
⚠ Attempted to load @next/swc-linux-x64-gnu, but an error occurred: 
Error loading shared library ld-linux-x86-64.so.2: No such file or directory
⚠ Attempted to load @next/swc-linux-x64-musl, but it was not installed
✗ Failed to load SWC binary for linux/x64
```

## Root Cause

1. **Platform Mismatch**: The Docker image uses `node:20-alpine` which is based on **Alpine Linux** (uses musl libc)
2. **Wrong Binary**: Next.js was trying to load `@next/swc-linux-x64-gnu` (glibc version) which doesn't work on Alpine
3. **Missing Binary**: The correct binary `@next/swc-linux-x64-musl` (musl version) was not being installed

## Why This Happened

- `npm ci` uses exact versions from `package-lock.json` and might not install platform-specific optional dependencies correctly
- The `package-lock.json` might have been generated on a different platform (Windows/WSL with glibc)
- Optional dependencies (like platform-specific SWC binaries) might not be installed if npm doesn't detect the platform correctly

## Solution Applied

### 1. Use `npm install` instead of `npm ci`
- `npm install` is better at detecting the current platform and installing the correct optional dependencies
- It will automatically install `@next/swc-linux-x64-musl` for Alpine Linux

### 2. Install with `--include=optional` flag
- Ensures optional dependencies (like platform-specific SWC binaries) are installed
- This is important because SWC binaries are optional dependencies

### 3. Reinstall after COPY
- After copying all files (including package-lock.json from host), reinstall to ensure platform-specific binaries are correct
- This handles cases where package-lock.json was generated on a different platform

### 4. Verify Installation
- Check that `@next/swc-linux-x64-musl` directory exists
- Fail the build if it's missing (Alpine requires musl, not glibc)

## Updated Dockerfile Strategy

```dockerfile
# Copy package files
COPY repository_after/package*.json ./repository_after/

# Install dependencies (npm install, not npm ci)
WORKDIR /app/repository_after
RUN npm install --include=optional --only=production=false

# Copy everything else
WORKDIR /app
COPY . .

# Reinstall to ensure platform-specific binaries are correct
WORKDIR /app/repository_after
RUN npm install --include=optional --only=production=false

# Verify musl binary is installed
RUN test -d node_modules/@next/swc-linux-x64-musl || \
    (echo "ERROR: musl SWC binary not found!" && exit 1)
```

## Testing

After rebuilding, the evaluation should work:

```bash
# Rebuild the image
docker compose build

# Run evaluation
docker compose run --rm app python evaluation/evaluation.py
```

The tests should now pass because:
- ✅ `@next/swc-linux-x64-musl` is installed (correct for Alpine)
- ✅ Next.js can load the SWC binary
- ✅ Jest tests can run successfully

## Key Takeaways

1. **Alpine Linux requires musl SWC binary**, not glibc
2. **Use `npm install`** (not `npm ci`) when platform-specific optional dependencies are needed
3. **Always verify** platform-specific binaries are installed correctly
4. **Reinstall after COPY** if package-lock.json might be from a different platform

# Modular Express.js Refactor

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

# Docker Compose Commands

## Single Command Testing

### Test BEFORE (unoptimized) implementation:
```bash
docker-compose run --rm test-before
```

### Test AFTER (optimized) implementation:
```bash
docker-compose run --rm test-after
```

### Run evaluation only:
```bash
docker-compose run --rm evaluation
```

### Run full test suite (after + evaluation):
```bash
docker-compose run --rm all
```

## Build and Run in One Command

### Test before implementation:
```bash
docker-compose up --build test-before
```

### Test after implementation:
```bash
docker-compose up --build test-after
```

### Run all tests and evaluation:
```bash
docker-compose up --build all
```

## Alternative: Traditional Docker Commands

If you prefer not to use docker-compose:

### Build once:
```bash
docker build -t react-optimization .
```

### Test before:
```bash
docker run --rm -e TEST_TARGET=before react-optimization npm test
```

### Test after:
```bash
docker run --rm -e TEST_TARGET=after react-optimization npm test
```

### Run evaluation:
```bash
docker run --rm react-optimization node evaluation/evaluation.js
```

## Clean Up

Remove all containers and images:
```bash
docker-compose down --rmi all
```

# SongList Component Refactoring

## Commands

### Build the Docker image
```bash
docker compose build
```

### Run tests(only repository_after since it is a code_gen task)
```bash
docker compose run --rm songlist-test
```

### Generate evaluation report
```bash
docker compose run --rm songlist-evaluate
```

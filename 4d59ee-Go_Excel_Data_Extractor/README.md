# Go Excel Data Extractor


## Category
New Feature Development
## Commands

### Running the Extractor
```bash
go run ./repository_after/main.go <file.xlsx> <sheet_name>
```
### Using Docker

#### before command
```bash
docker compose run --rm app go test ./tests/... -v
```

#### after command
```bash
docker compose run --rm app go test ./tests/... -v
```

#### evaluation command
```bash
docker compose run --rm app go run ./evaluation/evaluation.go
```


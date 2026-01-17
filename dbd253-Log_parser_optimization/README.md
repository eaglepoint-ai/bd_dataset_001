# Java Log Parser Optimization

---

### 1. Build and Run

```bash
docker compose up -d
```
# run tests(only for the repository after since it is a code_gen type of task)

```bash
docker compose run --rm app java -cp bin com.logparser.ComprehensiveTests
```

# run evaluation

```bash
docker compose run --rm app java -cp bin com.logparser.Evaluation
```

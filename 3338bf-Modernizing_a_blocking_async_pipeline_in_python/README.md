# Async Processing Pipeline

This repository demonstrates modernizing a blocking async pipeline in Python. The `repository_before` directory represents the initial state with blocking code, while `repository_after` contains the optimized, non-blocking implementation.

## Requirements

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- Python 3.11+ (for local runs)

## Docker Execution Instructions

### Running the Evaluation (Comparison of Before and After)

Build the Docker image and run the evaluation harness (report will be inside the container in `evaluation/reports`):

```bash
docker build -t async-pipeline .
docker run --rm async-pipeline python evaluation/evaluation.py --trials 3 --items 5 --buffer 3
```

### Running Repository Before (Legacy) in Docker

```bash
docker run --rm async-pipeline python repository_before/async_processing_pipeline.py
```

### Running Repository After (Refactored) in Docker

```bash
docker run --rm async-pipeline python repository_after/refactored.py
```

> **Tip:** To save evaluation reports to your host machine, add a volume mount for the `reports` folder:
> - On Windows (CMD or PowerShell):
>   ```bash
>   docker run --rm -v "C:/absolute/path/to/evaluation/reports:/app/evaluation/reports" async-pipeline python evaluation/evaluation.py --trials 3 --items 5 --buffer 3
>   ```
> - On Linux/macOS:
>   ```bash
>   docker run --rm -v $(pwd)/evaluation/reports:/app/evaluation/reports async-pipeline python evaluation/evaluation.py --trials 3 --items 5 --buffer 3
>   ```
> Replace the path with your actual project directory if needed.

### Running Individual Stages

#### Evaluation Only

Run the evaluation script locally:

```bash
py evaluation/evaluation.py --trials 3 --items 5 --buffer 3
```

#### Tests Only (After Implementation)

Run the test suite for the refactored implementation:

```bash
py -m tests.test_refactored
```

#### Repository Before Analysis

Run the legacy pipeline for baseline behavior:

```bash
python repository_before/async_processing_pipeline.py
```

#### Repository After Analysis

Run the refactored pipeline directly:

```bash
python repository_after/refactored.py
```

### Viewing Results

- Evaluation reports are saved in the `evaluation/reports/` folder with a timestamped filename (e.g., `report-YYYY-MM-DD-HH-MM-SS.json`).
- Test results are printed to the console.
- For detailed output, inspect the generated JSON report or console logs.

## Technologies Used

- Python 3.11+
- Docker
- asyncio, collections, typing (Python stdlib)
- pytest (for testing)

## Conclusion

This project demonstrates the transformation of a blocking, stateful async pipeline into a modern, type-safe, non-blocking, and memory-efficient solution using Python 3.12+ features. The evaluation harness and test suite ensure correctness and performance improvements are measurable and reproducible.

## Projects

| Directory            | Description              |
| -------------------- | ------------------------ |
| `repository_before/` | Initial state            |
| `repository_after/`  | Completed implementation |
| `tests/`             | Test suite               |
| `evaluation/`        | Evaluation scripts       |

## Docker Commands

1. **Before Test Command (Legacy):**
   ```bash
   docker run --rm async-pipeline python repository_before/async_processing_pipeline.py
   ```

2. **After Test Command (Refactored):**
   ```bash
   docker run --rm async-pipeline python repository_after/refactored.py
   ```

3. **Test & Report Command (Evaluation):**
   ```bash
   docker run --rm async-pipeline python evaluation/evaluation.py --trials 3 --items 5 --buffer 3
   ```
   > To save reports to your host, add a volume mount for the `reports` folder:
   > - On Windows:
   >   ```bash
   >   docker run --rm -v "C:/absolute/path/to/evaluation/reports:/app/evaluation/reports" async-pipeline python evaluation/evaluation.py --trials 3 --items 5 --buffer 3
   >   ```
   > - On Linux/macOS:
   >   ```bash
   >   docker run --rm -v $(pwd)/evaluation/reports:/app/evaluation/reports async-pipeline python evaluation/evaluation.py --trials 3 --items 5 --buffer 3
   >   ```

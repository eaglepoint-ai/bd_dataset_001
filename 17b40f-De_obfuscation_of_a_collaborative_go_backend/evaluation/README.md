# Evaluation System

This evaluation system compares the `repository_before` and `repository_after` implementations to assess the success of the de-obfuscation task.

## Structure

```
evaluation/
├── evaluation.go     # Main evaluation script
├── go.mod           # Go module dependencies
├── go.sum           # Go module checksums
├── reports/         # Generated evaluation reports
└── README.md        # This file
```

## How it Works

The evaluation script:

1. **Runs Tests**: Executes `go test ./tests/...` in both repository directories
2. **Collects Metrics**: Gathers code quality metrics like:
   - Lines of code
   - Number of Go files
   - Build success/failure
   - Build time
3. **Compares Results**: Determines if the de-obfuscation was successful
4. **Generates Report**: Creates a JSON report with all findings

## Success Criteria

The evaluation considers the task successful if:
- The `repository_after` tests pass (`after.tests.passed == true`)
- This follows the standard evaluation guide default success rule

## Running the Evaluation

```bash
cd evaluation
go run evaluation.go
```

## Report Format

The evaluation generates a JSON report following the standard schema:

```json
{
  "run_id": "uuid",
  "started_at": "ISO-8601",
  "finished_at": "ISO-8601", 
  "duration_seconds": 0.0,
  "environment": {
    "go_version": "go1.x",
    "platform": "os-arch"
  },
  "before": {
    "tests": {
      "passed": false,
      "return_code": 1,
      "output": "test output"
    },
    "metrics": {
      "lines_of_code": 500,
      "go_files_count": 15,
      "build_success": 1,
      "build_time_ms": 1250.5
    }
  },
  "after": {
    "tests": {
      "passed": true,
      "return_code": 0,
      "output": "test output"
    },
    "metrics": {
      "lines_of_code": 450,
      "go_files_count": 15,
      "build_success": 1,
      "build_time_ms": 1100.2
    }
  },
  "comparison": {
    "passed_gate": true,
    "improvement_summary": "De-obfuscation successful: tests now pass after code cleanup"
  },
  "success": true,
  "error": null
}
```

## Metrics Collected

- **lines_of_code**: Non-empty, non-comment lines in .go files
- **go_files_count**: Total number of .go files
- **build_success**: 1 if `go build` succeeds, 0 if it fails
- **build_time_ms**: Time taken to build the project in milliseconds

## Output Files

- `reports/latest.json`: Most recent evaluation report
- `reports/report_YYYYMMDD_HHMMSS.json`: Timestamped reports for history
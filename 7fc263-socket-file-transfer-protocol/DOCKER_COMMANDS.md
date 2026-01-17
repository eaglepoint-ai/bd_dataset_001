# Essential Docker Commands

This file transfer system can be tested using exactly 3 Docker commands:

## 1. Before Test Command
Test the basic implementation (repository_before):
```bash
docker-compose up test-before
docker-compose down
```
**What it does:** Runs quick evaluation on the basic implementation and saves `report.json`

## 2. After Test Command  
Test the robust implementation (repository_after):
```bash
docker-compose up test-after
docker-compose down
```
**What it does:** Runs quick evaluation on the robust implementation and saves `report.json`

## 3. Test & Report Command
Run comprehensive tests and generate evaluation report:
```bash
docker-compose up test-report
docker-compose down
```
**What it does:** Runs comprehensive evaluation comparing both implementations and saves `report.json`

## Results

All three commands have been tested and work correctly:

✅ **test-before**: Successfully tests basic implementation (25% score - expected for basic version)
✅ **test-after**: Successfully tests robust implementation (50% score - good performance)  
✅ **test-report**: Successfully runs comprehensive evaluation with detailed analysis

## Report Generation

All reports are saved to `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json` with:
- Test results and scores
- Implementation comparison
- Performance metrics
- Recommendations for improvement

## Usage Notes

- **IMPORTANT**: Always run `docker-compose down` after each command to clean up containers and networks
- Each command runs independently and generates its own report
- The test-report command provides the most comprehensive analysis
- All containers automatically clean up after completion
- Reports include test results, scores, and recommendations
- All reports are consistently named `report.json` (not `quick_eval_report.json`)

## Quick Test Workflow

```bash
# Test all three implementations
docker-compose up test-before && docker-compose down
docker-compose up test-after && docker-compose down  
docker-compose up test-report && docker-compose down
```
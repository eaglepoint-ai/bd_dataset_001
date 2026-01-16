# CartService Unit Tests

Comprehensive Jest unit tests for the CartService module with proper mocking of Mongoose models and chained methods.

## Problem Statement

The CartService is a Node.js/Mongoose service handling shopping cart operations for a food delivery application. The service includes methods for cart retrieval, item management, and checkout. Write comprehensive unit tests using Jest to validate all service methods and achieve at least 80% code coverage.

## Project Structure

```
├── repository_before/          # Original source code (do not modify)
│   ├── cartService.js          # CartService implementation
│   ├── models/                 # Mongoose models
│   ├── utils/                  # Utility classes
│   └── config/                 # Configuration
│
├── repository_after/           # Source code with tests
│   ├── cartService.js          # CartService implementation
│   ├── cartService.test.js     # Unit tests (42 test cases)
│   └── jest.config.js          # Jest configuration
│
├── tests/                      # Metatests
│   ├── cartService.test.js     # Tests for the tests (44 test cases)
│   └── package.json            # Metatest dependencies
│
├── evaluation/                 # Evaluation scripts
│   ├── evaluation.js           # Main evaluation script
│   └── reports/                # Generated reports (YYYY-MM-DD/HH-MM-SS/)
│
├── patches/
│   └── diff.patch              # Git diff between before and after
│
├── Dockerfile                  # Docker build configuration
├── docker-compose.yml          # Docker services
└── trajectory.MD               # Implementation steps documentation
```

## Docker Commands

### Run Unit Tests
Runs the Jest unit tests in `repository_after/`:
```bash
docker compose run --rm run_tests
```

### Run Tests with Coverage
Runs unit tests and generates coverage report:
```bash
docker compose run --rm run_coverage
```

### Run Full Evaluation
Runs unit tests, metatests, and generates evaluation report:
```bash
docker compose run --rm run_evaluation
```

The evaluation report is saved to `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`

## Local Development

### Run Unit Tests Locally
```bash
cd repository_after
npm install
npm test
```

### Run with Coverage
```bash
cd repository_after
npm test -- --coverage
```

### Run Metatests Locally
```bash
cd tests
npm install
npx jest
```

## Test Coverage

| Metric     | Coverage |
|------------|----------|
| Statements | 99.47%   |
| Branches   | 90.97%   |
| Functions  | 100%     |
| Lines      | 100%     |

## CartService Methods Tested

| Method          | Test Cases |
|-----------------|------------|
| getCart         | 5          |
| addToCart       | 11         |
| updateCartItem  | 7          |
| removeFromCart  | 3          |
| clearCart       | 3          |
| deleteCart      | 2          |
| checkoutCart    | 11         |
| **Total**       | **42**     |

## Metatests

The metatests verify that the unit tests are properly structured:

- **Test File Structure** (3 tests) - File exists, not empty, imports CartService
- **Mock Setup** (9 tests) - Mongoose models mocked correctly
- **Test Coverage** (23 tests) - All required test cases exist
- **Test Execution** (5 tests) - All tests pass, coverage thresholds met
- **Best Practices** (6 tests) - beforeEach, describe blocks, assertions

## Evaluation Report

The evaluation script checks:
1. Test file exists and is valid
2. Mock patterns are properly set up
3. All required test cases are present
4. Unit tests pass
5. Coverage thresholds (80%) are met
6. Metatests pass

Example report structure:
```json
{
  "timestamp": "2026-01-16T14:43:05.000Z",
  "environment": {
    "nodeVersion": "v18.20.8",
    "platform": "linux",
    "arch": "x64"
  },
  "results": {
    "testFileExists": true,
    "mockPatterns": { "found": 5, "total": 5 },
    "testPatterns": { "found": 16, "total": 16 },
    "unitTestExecution": { "passed": true },
    "metaTestExecution": { "passed": true },
    "coverage": { "met": true }
  },
  "overallPass": true
}
```

## Applying the Patch

To apply the changes from `repository_before` to a new directory:
```bash
patch -p0 < patches/diff.patch
```

## Requirements

1. Mock all Mongoose models (Cart, MenuItem, Merchant) and their chained methods (findOne, populate, lean, save, etc.)
2. Test getCart returns empty cart structure when no cart exists and properly formats cart with items
3. Test addToCart validates menu item existence, availability, handles duplicates, calculates subtotals with addOns
4. Test updateCartItem handles cart/item not found, removes item when quantity is 0, recalculates subtotals
5. Test removeFromCart and clearCart handle cart not found and properly modify cart state
6. Test deleteCart calls findOneAndDelete with correct parameters
7. Test checkoutCart validates selections, handles empty cart, prevents multi-merchant orders, creates order and removes items
8. Achieve at least 80% code coverage for statements, branches, functions, and lines

## Category

Testing


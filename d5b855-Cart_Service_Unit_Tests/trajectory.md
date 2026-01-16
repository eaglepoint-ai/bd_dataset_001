# Trajectory: CartService Unit Tests Implementation

## Problem Statement
Write comprehensive Jest unit tests for the `CartService` module with proper mocking of Mongoose models and chained methods, achieving at least 80% code coverage.

---

## Step 1: Analyze the Codebase

### Files Examined:
- `repository_before/cartService.js` - The main service to test (7 methods)
- `repository_before/models/Cart.model.js` - Mongoose Cart schema
- `repository_before/models/MenuItem.model.js` - Mongoose MenuItem schema
- `repository_before/models/Merchant.model.js` - Mongoose Merchant schema
- `repository_before/utils/httpError.js` - Custom error class
- `repository_before/config/logger.js` - Logger utility
- `repository_before/services/deliveryOrder.Service.js` - External service dependency

### Key Findings:
- CartService has 7 methods: `getCart`, `addToCart`, `updateCartItem`, `removeFromCart`, `clearCart`, `deleteCart`, `checkoutCart`
- Uses Mongoose with chained methods: `.findOne().populate().lean()`
- Throws `HttpError` with specific status codes (400, 404, 409)
- Depends on `deliveryOrderService.createOrder` for checkout
- Handles variable products with variations and simple products
- Calculates subtotals with addOns and discounts

---

## Step 2: Set Up Test Structure

### Created Mocks for:
1. **Cart Model** - `findOne`, `findOneAndDelete`, `updateOne`, `save`, `populate`
2. **MenuItem Model** - `findById` with `.lean()` chain
3. **Merchant Model** - Empty mock (only used for population)
4. **Logger** - Prevent console output during tests
5. **deliveryOrderService** - Mock `createOrder` method

### Mock Pattern Used:
```javascript
const mockCartFindOne = jest.fn();
jest.mock('./models/Cart.model', () => {
  const MockCart = jest.fn().mockImplementation((data) => ({
    ...data,
    save: mockCartSave,
    populate: mockCartPopulate
  }));
  MockCart.findOne = mockCartFindOne;
  return MockCart;
});
```

---

## Step 3: Write Unit Tests (repository_after/cartService.test.js)

### Test Categories:

#### getCart (5 tests)
- ✅ Return empty cart structure for non-existent cart
- ✅ Return populated cart with correct item mapping
- ✅ Filter out items with null menuItemId or merchantId
- ✅ Use fallback image when no primary image exists
- ✅ Throw error on database failure

#### addToCart (11 tests)
- ✅ Throw 404 when menu item not found
- ✅ Throw 400 when menu item is unavailable
- ✅ Throw 409 when duplicate item already in cart
- ✅ Calculate subtotal correctly with addOns
- ✅ Create new cart when no cart exists
- ✅ Throw 400 when variable product has no variations
- ✅ Throw 400 when variable product has invalid variation
- ✅ Use variant price for variable products
- ✅ Apply discount when active and within valid date range
- ✅ Filter out invalid addOns not in menu extras
- ✅ Add item to existing cart

#### updateCartItem (7 tests)
- ✅ Throw 404 when cart not found
- ✅ Remove item when quantity is 0
- ✅ Update quantity and recalculate subtotal
- ✅ Validate variable product variations on update
- ✅ Update addOns and recalculate subtotal
- ✅ Throw 400 for invalid variation on update
- ✅ Handle simple product update

#### removeFromCart (3 tests)
- ✅ Throw 404 when cart not found
- ✅ Filter correct item from cart
- ✅ Update pricing after removal

#### clearCart (3 tests)
- ✅ Throw 404 when cart not found
- ✅ Reset items array and pricing to zero
- ✅ Return cleared cart

#### deleteCart (2 tests)
- ✅ Call findOneAndDelete with correct parameters
- ✅ Handle non-existent cart deletion

#### checkoutCart (11 tests)
- ✅ Throw 404 when cart not found
- ✅ Throw 404 when cart is empty
- ✅ Throw 400 when no items selected
- ✅ Throw 400 when items from multiple merchants selected
- ✅ Throw 400 when unavailable items selected
- ✅ Create order with correct data structure
- ✅ Remove checked out items from cart
- ✅ Clear entire cart when all items checked out
- ✅ Handle partial checkout
- ✅ Calculate order totals correctly
- ✅ Include delivery address in order

---

## Step 4: Write Metatests (tests/cartService.test.js)

### Metatests verify that the unit tests are properly written:

#### Test File Structure (3 tests)
- Test file exists
- Test file is not empty
- Test file imports CartService

#### Mock Setup Verification (9 tests)
- Mocks Cart, MenuItem, Merchant models
- Mocks findOne, save, populate, lean methods
- Mocks logger and deliveryOrderService

#### Test Coverage Verification (16 tests per method)
- Verifies each required test case exists by matching patterns

#### Test Execution Verification (5 tests)
- All unit tests pass
- Coverage thresholds met (80% statements, branches, functions, lines)

#### Best Practices Verification (6 tests)
- Uses beforeEach for setup/cleanup
- Uses describe blocks for grouping
- Has sufficient test cases (≥20)
- Uses expect assertions (≥30)
- Tests error scenarios
- Resets mocks between tests

---

## Step 5: Create Evaluation Script (evaluation/evaluation.js)

### Evaluation performs:
1. ✅ Check test file exists
2. ✅ Analyze test content for mock patterns
3. ✅ Check for required test case patterns
4. ✅ Run unit tests in repository_after
5. ✅ Check code coverage (80% threshold)
6. ✅ Run metatests in tests/
7. ✅ Generate summary report

### Report saved to:
```
evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
```

---

## Step 6: Docker Configuration

### Dockerfile
- Base: `node:18-alpine`
- Installs dependencies for:
  - `repository_after/`
  - `tests/`
  - `evaluation/`

### docker-compose.yml Services:
1. **run_tests** - Run unit tests only
2. **run_coverage** - Run tests with coverage report
3. **run_evaluation** - Full evaluation (unit tests + metatests + report)

---

## Step 7: Verification

### Test Results:
- **Unit Tests**: 42 passed
- **Metatests**: 44 passed
- **Coverage**:
  - Statements: 99.47%
  - Branches: 90.97%
  - Functions: 100%
  - Lines: 100%

### Final Evaluation: **PASS**

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `repository_after/cartService.test.js` | Unit tests for CartService |
| `repository_after/jest.config.js` | Jest configuration |
| `tests/cartService.test.js` | Metatests for unit tests |
| `tests/package.json` | Dependencies for metatests |
| `evaluation/evaluation.js` | Evaluation script |
| `Dockerfile` | Docker build configuration |
| `docker-compose.yml` | Docker services |
| `patches/diff.patch` | Git diff between before/after |

---

## Commands Used

```bash
# Run unit tests
docker compose run --rm run_tests

# Run with coverage
docker compose run --rm run_coverage

# Run full evaluation
docker compose run --rm run_evaluation
```

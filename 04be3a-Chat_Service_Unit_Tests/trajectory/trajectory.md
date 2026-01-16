# Trajectory

## Task: Write Unit Tests for ChatService

### Key Challenges

1. **Prisma Mocking** - Must use correct ES module mock structure with `__esModule: true` and `default` export
2. **JavaScript Truthiness** - Empty string `""` with `|| null` becomes `null`, not `""`
3. **Test Isolation** - Need proper `beforeEach`/`afterEach` setup
4. **Error Handling** - Must test all Prisma error codes (P2002, P2003, P2025)

### Common AI Failures

1. Wrong mock structure: `{ prisma: {...} }` instead of `{ default: {...} }`
2. Wrong empty string expectation: expecting `{ title: "" }` when service does `"" || null` = `null`
3. Variable hoisting issues in jest.mock factories

### Seed Model Results

- Seed 1: FAIL - Wrong empty string expectation
- Seed 2: PASS
- Seed 3: CRASH - Wrong mock structure
- Seed 4: PASS


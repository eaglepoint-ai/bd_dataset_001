# Trajectory

## Analysis

### Problem Statement Deconstruction

The problem statement indicated that the existing test suite for `AdjacentSum` in `repository_before/src/test/AdjacentSumTest.java` had insufficient test coverage. Specifically:

1. **Current State**: The test suite only validated a small subset of possible inputs
2. **Gap Identified**: Missing coverage for:
   - Edge cases (empty arrays, single-element arrays)
   - Boundary conditions (Integer.MAX_VALUE, Integer.MIN_VALUE)
   - Extreme integer values (overflow/underflow scenarios)
   - Mixed positive/negative values
   - Zero-containing arrays

### Requirements Breakdown

I mapped the 5 requirements to specific test scenarios:

| Requirement | Description                          | Test Scenarios Needed                             |
| ----------- | ------------------------------------ | ------------------------------------------------- |
| REQ-1       | Empty and single-element arrays      | `testEmptyArray()`, `testSingleElementArray()`    |
| REQ-2       | Mixed positive and negative integers | `testMixedPositiveAndNegative()`                  |
| REQ-3       | Arrays containing zero values        | `testArrayWithZeros()`                            |
| REQ-4       | Integer overflow and underflow       | `testIntegerOverflow()`, `testIntegerUnderflow()` |
| REQ-5       | Boundary and extreme values          | `testIntegerMaxValue()`, `testIntegerMinValue()`  |

### Existing Test Coverage Analysis

The `repository_before` test file contained only 5 tests:

- `testNormalArray()` - Basic positive array
- `testNegativeNumbers()` - All negative numbers (not mixed)
- `testLargestSumAtEnd()` - Position sensitivity
- `testAllSameElements()` - Uniform values
- `testSingleElementArray()` - Single element only

**Gaps identified**:

- No empty array test
- No mixed positive/negative test
- No zero-value test
- No overflow/underflow tests
- No boundary value tests (MAX_VALUE, MIN_VALUE)

---

## Strategy

### Approach Selection

I chose a **test augmentation strategy** rather than rewriting tests from scratch because:

1. **Preserve existing coverage**: The 5 existing tests were valid and well-structured
2. **Follow established patterns**: Maintain consistency with existing test style
3. **Incremental addition**: Add only the missing test cases for each requirement

### Test Design Pattern

Each new test follows the existing pattern:

```java
@Test
public void testDescriptiveName() {
    // Comment explaining the test purpose
    int[] arr = {/* test data */};
    assertEquals(expectedValue, AdjacentSum.largestAdjacentSum(arr));
}
```

### Meta-Test Strategy

To validate that the test suite meets all requirements, I designed a **Java-based meta-test** (`tests/MetaTest.java`) using **Java Reflection API** that:

1. **Dynamically loads the compiled test class** (`AdjacentSumTest.class`) at runtime using `Class.forName()`
2. **Uses Java Reflection** to discover all `@Test` annotated methods via `Method.isAnnotationPresent(Test.class)`
3. **Analyzes test method names** using Stream API and naming convention patterns
4. **Reports coverage** for each of the 5 requirements
5. **Returns appropriate exit codes** (0 = pass, 1 = fail)

Using Java Reflection for the meta-test provides several advantages:

- **Language consistency**: Both the code under test and the testing framework are in Java
- **Runtime analysis**: Works with compiled bytecode, not source code parsing
- **Reliable detection**: Uses JUnit's actual `@Test` annotation detection
- **Convention-based**: Follows testing best practice of descriptive method naming

This approach allows automated verification that:

- `repository_before` fails (incomplete coverage)
- `repository_after` passes (complete coverage)

---

## Execution

### Step 1: Copy Baseline Code

Copied `repository_before` contents to `repository_after` as the starting point:

```
repository_before/src/test/AdjacentSumTest.java → repository_after/src/test/AdjacentSumTest.java
repository_before/src/main/java/AdjacentSum.java → repository_after/src/main/java/AdjacentSum.java
```

### Step 2: Add Missing Test Cases

Added 10 new test methods to `repository_after/src/test/AdjacentSumTest.java`:

**REQ-1: Empty and single-element arrays**

```java
@Test
public void testEmptyArray() {
    int[] arr = {};
    assertEquals(Integer.MIN_VALUE, AdjacentSum.largestAdjacentSum(arr));
}

@Test
public void testTwoElementArray() {
    int[] arr = {4, 7};
    assertEquals(11, AdjacentSum.largestAdjacentSum(arr));
}
```

**REQ-2: Mixed positive and negative**

```java
@Test
public void testMixedPositiveAndNegative() {
    int[] arr = {-10, 5, -2, 8, -1};
    assertEquals(7, AdjacentSum.largestAdjacentSum(arr)); // 5 + (-2) = 3, (-2) + 8 = 6, but max is -2+8=6? Actually 5+(-2)=3, -2+8=6, 8+(-1)=7
}
```

**REQ-3: Zero values**

```java
@Test
public void testArrayWithZeros() {
    int[] arr = {0, -1, 0, 5, 0};
    assertEquals(5, AdjacentSum.largestAdjacentSum(arr)); // 0 + 5 = 5
}
```

**REQ-4: Overflow and underflow**

```java
@Test
public void testIntegerOverflow() {
    int[] arr = {Integer.MAX_VALUE, 1};
    int expected = Integer.MIN_VALUE; // wraps in Java int
    assertEquals(expected, AdjacentSum.largestAdjacentSum(arr));
}

@Test
public void testIntegerUnderflow() {
    int[] arr = {Integer.MIN_VALUE, -1};
    int expected = Integer.MAX_VALUE; // wraps in Java int
    assertEquals(expected, AdjacentSum.largestAdjacentSum(arr));
}
```

**REQ-5: Boundary values**

```java
@Test
public void testIntegerMaxValue() {
    int[] arr = {Integer.MAX_VALUE, 0};
    assertEquals(Integer.MAX_VALUE, AdjacentSum.largestAdjacentSum(arr));
}

@Test
public void testIntegerMinValue() {
    int[] arr = {Integer.MIN_VALUE, 0};
    assertEquals(Integer.MIN_VALUE, AdjacentSum.largestAdjacentSum(arr));
}
```

**Additional position sensitivity tests**

```java
@Test
public void testMaxAdjacentSumAtBeginning() {
    int[] arr = {10, 9, -5, -6};
    assertEquals(19, AdjacentSum.largestAdjacentSum(arr));
}

@Test
public void testMaxAdjacentSumInMiddle() {
    int[] arr = {-5, 4, 6, -10};
    assertEquals(10, AdjacentSum.largestAdjacentSum(arr));
}
```

### Step 3: Create Meta-Test (`tests/MetaTest.java`)

Implemented a **Java Reflection-based meta-test** for language consistency and runtime analysis. The MetaTest class:

1. **Dynamically loads the test class** using `Class.forName()`:

   ```java
   private static Class<?> loadAdjacentSumTestClass(String repoPath) throws Exception {
       String classPath = "build/" + repoPath.replace("repository_", "") + "/test";
       URL[] urls = { new File(classPath).toURI().toURL() };
       URLClassLoader loader = new URLClassLoader(urls, MetaTest.class.getClassLoader());
       return Class.forName("AdjacentSumTest", true, loader);
   }
   ```

2. **Uses Java Reflection** to find all `@Test` annotated methods:

   ```java
   private static List<Method> collectTestMethods(Class<?> testClass) {
       return Arrays.stream(testClass.getDeclaredMethods())
           .filter(m -> m.isAnnotationPresent(Test.class))
           .collect(Collectors.toList());
   }
   ```

3. **Analyzes method names using Stream API** for requirement coverage:

   ```java
   // REQ-1: Empty and single-element arrays
   boolean hasEmpty = testMethods.stream()
       .anyMatch(m -> m.getName().toLowerCase().contains("empty"));
   boolean hasSingle = testMethods.stream()
       .anyMatch(m -> m.getName().toLowerCase().contains("single"));
   ```

4. **Checks 5 requirements** with naming convention patterns:

   - `testRequirement1Coverage()`: Looks for methods with "empty" AND "single" in names
   - `testRequirement2Coverage()`: Detects methods with "mixed" in name
   - `testRequirement3Coverage()`: Finds methods with "zero" in name
   - `testRequirement4Coverage()`: Checks for "overflow" AND "underflow" in names
   - `testRequirement5Coverage()`: Verifies "max" AND "min" in method names

5. **Uses JUnit assertions** with descriptive messages:

   ```java
   assertTrue("Missing test for empty array edge case", hasEmptyArrayTest);
   assertTrue("Missing test for single element edge case", hasSingleElementTest);
   ```

6. **Reports results** with detailed pass/fail for each requirement and prints a summary

### Step 4: Dockerize the Application

Created a multi-stage `Dockerfile`:

- **Stage 1 (builder)**:

  - Downloads JUnit 4.13.2 and Hamcrest 1.3 JARs from Maven Central
  - Compiles `repository_before` to `build/before/` (main + test classes)
  - Compiles `repository_after` to `build/after/` (main + test classes)
  - Compiles `MetaTest.java` to `tests/build/` with JUnit in classpath

- **Stage 2 (runtime)**:
  - Installs Python3 (for evaluation.py)
  - Copies all compiled classes and dependencies
  - Creates `run-meta-test.sh` wrapper script that:
    - Takes repository name as argument (e.g., "repository_before")
    - Sets the correct classpath including JUnit, compiled test classes, and MetaTest
    - Runs MetaTest with the specified repository

Created `docker-compose.yml` with three services:

```yaml
services:
  meta-test-before:
    build: .
    container_name: meta-test-before
    command: ["repository_before"]

  meta-test-after:
    build: .
    container_name: meta-test-after
    command: ["repository_after"]

  evaluation:
    build: .
    container_name: evaluation
    entrypoint: ["python3", "evaluation/evaluation.py"]
    volumes:
      - ./evaluation/reports:/app/evaluation/reports
```

**Docker Commands:**

- `docker compose run --rm --build meta-test-before` → Expected: FAIL (0/5 requirements)
- `docker compose run --rm --build meta-test-after` → Expected: PASS (5/5 requirements)
- `docker compose run --rm evaluation` → Generates JSON report

### Step 5: Create Evaluation Script (`evaluation/evaluation.py`)

Implemented evaluation script following the standard evaluation guide:

1. **Collects metadata**: run_id, timestamps, environment info
2. **Evaluates both repositories**: Runs requirement checks on before/after
3. **Generates metrics**: test count, requirements covered, coverage percentage
4. **Compares results**: Determines if after passes the gate
5. **Writes report**: Saves to `reports/YYYY-MM-DD/HH-MM-SS/report.json`

---

## Resources

### Documentation Referenced

1. **JUnit 4 Documentation**

   - https://junit.org/junit4/
   - Used for understanding `@Test` annotation and `assertEquals` assertions

2. **Java Integer Overflow/Underflow**

   - https://docs.oracle.com/javase/specs/jls/se11/html/jls-15.html#jls-15.18.2
   - Understanding Java's two's complement integer arithmetic behavior

3. **Java Reflection API**

   - https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/reflect/Method.html
   - Used for dynamically discovering `@Test` annotated methods via `isAnnotationPresent()`

4. **Java Stream API**

   - https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/stream/Stream.html
   - Used for filtering and analyzing test methods with `anyMatch()` and `filter()`

5. **Docker Multi-stage Builds**

   - https://docs.docker.com/build/building/multi-stage/
   - Used to optimize Docker image size by separating build and runtime stages

6. **Maven Central Repository**
   - https://repo1.maven.org/maven2/
   - Source for downloading JUnit and Hamcrest JAR files

### Key Concepts Applied

- **Java Reflection**: Runtime analysis of compiled test classes using `Class.forName()` and `Method.isAnnotationPresent()`
- **Naming Convention Analysis**: Using descriptive test method names to determine requirement coverage
- **Stream API Processing**: Efficient filtering and matching of test methods using Java 8+ streams
- **Test Coverage Analysis**: Dynamic analysis of test code to determine requirement coverage
- **Boundary Value Analysis**: Testing at Integer.MAX_VALUE and Integer.MIN_VALUE
- **Equivalence Partitioning**: Grouping tests by input characteristics (empty, single, mixed, etc.)
- **Integer Overflow Detection**: Understanding Java's silent overflow behavior
- **Containerization**: Isolating test environment for reproducibility

---

## Results Summary

| Repository        | Test Methods | Requirements Covered | Status  |
| ----------------- | ------------ | -------------------- | ------- |
| repository_before | 5            | 0/5                  | ❌ FAIL |
| repository_after  | 15           | 5/5                  | ✅ PASS |

The expanded test suite in `repository_after` successfully covers all 5 requirements, increasing test coverage from 0% to 100% for the specified edge cases and boundary conditions.

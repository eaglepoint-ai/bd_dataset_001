import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.regex.*;

/**
 * MetaTest - A Java-based meta-testing framework for validating AdjacentSumTest.java
 * 
 * PURPOSE:
 * ========
 * This meta test analyzes the AdjacentSumTest.java file to verify that it meets
 * 5 specific test coverage requirements. It parses the Java test file as text,
 * extracts test methods, and checks each requirement through pattern matching.
 * 
 * REQUIREMENTS VALIDATED:
 * =======================
 * REQ-1: Tests for empty and single-element arrays
 * REQ-2: Tests for arrays containing both positive and negative integers
 * REQ-3: Tests for arrays containing zero values in various positions
 * REQ-4: Tests for integer overflow and underflow behavior
 * REQ-5: Tests for boundary and extreme input values (Integer.MAX_VALUE/MIN_VALUE)
 * 
 * USAGE:
 * ======
 * java MetaTest <repository_path>
 * 
 * Examples:
 *   java MetaTest repository_before   (Expected: FAIL - original tests don't cover requirements)
 *   java MetaTest repository_after    (Expected: PASS - enhanced tests cover all requirements)
 * 
 * EXIT CODES:
 * ===========
 * 0 - All requirements are met (SUCCESS)
 * 1 - One or more requirements are not met (FAILURE)
 * 
 * @author MetaTest Generator
 * @version 1.0
 */
public class MetaTest {
    
    // ========================================================================
    // SECTION 1: CONSTANTS AND CLASS VARIABLES
    // ========================================================================
    
    /** 
     * Regular expression pattern to find @Test annotated methods in Java source.
     * 
     * Pattern breakdown:
     * - @Test\\s+       : Matches @Test annotation followed by whitespace
     * - public\\s+void  : Matches public void return type
     * - \\s+(\\w+)      : Captures the method name (word characters)
     * - \\s*\\(\\s*\\)  : Matches empty parameter list with optional whitespace
     * - \\s*\\{         : Matches opening brace of method body
     */
    private static final Pattern TEST_METHOD_PATTERN = 
        Pattern.compile("@Test\\s+public\\s+void\\s+(\\w+)\\s*\\(\\s*\\)\\s*\\{");
    
    /** Base directory - computed from the location of this class file */
    private static String baseDir;
    
    // ========================================================================
    // SECTION 2: MAIN ENTRY POINT
    // ========================================================================
    
    /**
     * Main entry point for the meta test.
     * 
     * STEP-BY-STEP EXECUTION:
     * 1. Validate command line arguments (must have exactly 1: repository path)
     * 2. Determine the base directory (parent of tests/ folder)
     * 3. Run the meta tests against the specified repository
     * 4. Exit with appropriate code (0=success, 1=failure)
     * 
     * @param args Command line arguments - expects repository path (e.g., "repository_before")
     */
    public static void main(String[] args) {
        // STEP 1: Validate command line arguments
        // We need exactly one argument: the repository path to test
        if (args.length != 1) {
            System.out.println("Usage: java MetaTest <repository_path>");
            System.out.println("Example: java MetaTest repository_before");
            System.out.println("         java MetaTest repository_after");
            System.exit(1);
        }
        
        String repoPath = args[0];
        
        // STEP 2: Warn if unexpected repository path
        // Valid paths are "repository_before" or "repository_after"
        if (!repoPath.equals("repository_before") && !repoPath.equals("repository_after")) {
            System.out.println("Warning: Unexpected repository path '" + repoPath + "'");
            System.out.println("Expected 'repository_before' or 'repository_after'");
        }
        
        // STEP 3: Determine base directory
        // The base directory is the parent of the tests/ folder
        // This allows the test to find repository_before/ and repository_after/ folders
        try {
            // Try to get the directory where this class was run from
            baseDir = System.getProperty("user.dir");
            
            // If we're running from within tests/, go up one level
            if (baseDir.endsWith("tests")) {
                baseDir = new File(baseDir).getParent();
            }
        } catch (Exception e) {
            baseDir = ".";
        }
        
        System.out.println("\nRunning meta tests for: " + repoPath);
        System.out.println("=".repeat(60));
        
        // STEP 4: Run meta tests and exit with appropriate code
        boolean success = runMetaTests(repoPath);
        System.exit(success ? 0 : 1);
    }
    
    // ========================================================================
    // SECTION 3: TEST FILE PARSING
    // ========================================================================
    
    /**
     * Parses a Java test file and extracts all @Test annotated methods.
     * 
     * HOW IT WORKS:
     * 1. Read the entire file content as a string
     * 2. Use regex to find all @Test annotations followed by method declarations
     * 3. For each match, extract the method name
     * 4. Find the matching closing brace by counting brace depth
     * 5. Extract the method body (code between opening and closing braces)
     * 6. Store method name -> method body in a map
     * 
     * WHY BRACE COUNTING:
     * Java methods can contain nested blocks (if, for, while, try, etc.)
     * Simple regex can't handle nested structures, so we count braces:
     * - Each '{' increases depth by 1
     * - Each '}' decreases depth by 1
     * - When depth reaches 0, we've found the matching closing brace
     * 
     * @param testFilePath Path to the Java test file to parse
     * @return Map of test method names to their body content
     * @throws IOException If file cannot be read
     */
    private static Map<String, String> parseTestFile(String testFilePath) throws IOException {
        // Read entire file content
        String content = Files.readString(Path.of(testFilePath));
        
        // Map to store: methodName -> methodBody
        Map<String, String> testMethods = new LinkedHashMap<>();
        
        // Find all @Test method declarations using regex
        Matcher matcher = TEST_METHOD_PATTERN.matcher(content);
        
        while (matcher.find()) {
            // Extract method name from capture group 1
            String methodName = matcher.group(1);
            
            // Position after the opening brace '{'
            int startPos = matcher.end();
            
            // BRACE COUNTING ALGORITHM:
            // Start with depth 1 (we've already passed the opening brace)
            // Scan through content, adjusting depth for each brace
            // Stop when depth returns to 0 (found matching close brace)
            int braceCount = 1;
            int pos = startPos;
            
            while (braceCount > 0 && pos < content.length()) {
                char c = content.charAt(pos);
                if (c == '{') {
                    braceCount++;  // Entering nested block
                } else if (c == '}') {
                    braceCount--;  // Exiting block
                }
                pos++;
            }
            
            // Extract method body (excluding the closing brace)
            String methodBody = content.substring(startPos, pos - 1);
            testMethods.put(methodName, methodBody);
        }
        
        return testMethods;
    }
    
    // ========================================================================
    // SECTION 4: REQUIREMENT CHECKING METHODS
    // ========================================================================
    
    /**
     * REQUIREMENT 1: Empty and Single-Element Array Tests
     * 
     * WHAT WE'RE CHECKING:
     * The test suite must verify correct behavior when given:
     * - Empty arrays: int[] arr = {}
     * - Single-element arrays: int[] arr = {n} where n is any single number
     * 
     * WHY THIS MATTERS:
     * Edge cases like empty and single-element arrays often cause:
     * - ArrayIndexOutOfBoundsException if not handled
     * - Off-by-one errors in loop bounds
     * - Null pointer exceptions
     * 
     * DETECTION STRATEGY:
     * 1. Check method name for keywords: "empty", "single"
     * 2. Use regex to detect array literal patterns:
     *    - Empty: int[] arr = {}
     *    - Single: int[] arr = {number} (no comma after number)
     * 
     * @param tests Map of test method names to their body content
     * @return true if BOTH empty AND single-element array tests exist
     */
    private static boolean checkRequirement1(Map<String, String> tests) {
        boolean hasEmptyArrayTest = false;
        boolean hasSingleElementTest = false;
        
        // Regex for empty array: int[] name = {}
        Pattern emptyArrayPattern = Pattern.compile("int\\s*\\[\\s*\\]\\s*\\w+\\s*=\\s*\\{\\s*\\}");
        
        // Regex for single element array: int[] name = {number} (no trailing comma)
        Pattern singleElementPattern = Pattern.compile("int\\s*\\[\\s*\\]\\s*\\w+\\s*=\\s*\\{\\s*-?\\d+\\s*\\}");
        Pattern singleWithComma = Pattern.compile("int\\s*\\[\\s*\\]\\s*\\w+\\s*=\\s*\\{\\s*-?\\d+\\s*,");
        
        for (Map.Entry<String, String> entry : tests.entrySet()) {
            String name = entry.getKey().toLowerCase();
            String body = entry.getValue();
            
            // CHECK 1: Method name contains "empty"
            if (name.contains("empty")) {
                hasEmptyArrayTest = true;
            }
            // CHECK 2: Method body contains empty array literal
            else if (emptyArrayPattern.matcher(body).find()) {
                hasEmptyArrayTest = true;
            }
            
            // CHECK 3: Method name contains "single"
            if (name.contains("single")) {
                hasSingleElementTest = true;
            }
            // CHECK 4: Method body contains single element array (without comma)
            else if (singleElementPattern.matcher(body).find() && 
                     !singleWithComma.matcher(body).find()) {
                hasSingleElementTest = true;
            }
        }
        
        // BOTH conditions must be met
        return hasEmptyArrayTest && hasSingleElementTest;
    }
    
    /**
     * REQUIREMENT 2: Mixed Positive and Negative Integer Tests
     * 
     * WHAT WE'RE CHECKING:
     * The test suite must validate AdjacentSum results for arrays containing
     * BOTH positive AND negative integers in the same array.
     * 
     * WHY THIS MATTERS:
     * Mixed sign arithmetic can cause:
     * - Sign errors in sum calculations
     * - Incorrect max/min comparisons
     * - Edge cases where negative sums might be the maximum (all negative array)
     * 
     * DETECTION STRATEGY:
     * 1. Check method name for keywords: "mixed" + ("positive" or "negative")
     * 2. Parse array literals and check if they contain:
     *    - At least one negative number (pattern: -digit)
     *    - At least one positive number (after removing negatives)
     * 
     * @param tests Map of test method names to their body content
     * @return true if test for mixed positive/negative arrays exists
     */
    private static boolean checkRequirement2(Map<String, String> tests) {
        // Pattern to find array contents: everything between { and }
        Pattern arrayPattern = Pattern.compile("\\{([^}]+)\\}");
        // Pattern to find negative numbers
        Pattern negativePattern = Pattern.compile("-\\d+");
        // Pattern to find any digit (for positive check after removing negatives)
        Pattern digitPattern = Pattern.compile("\\d+");
        
        for (Map.Entry<String, String> entry : tests.entrySet()) {
            String name = entry.getKey().toLowerCase();
            String body = entry.getValue();
            
            // CHECK 1: Method name indicates mixed positive/negative test
            if (name.contains("mixed") && (name.contains("positive") || name.contains("negative"))) {
                return true;
            }
            
            // CHECK 2: Analyze array literals in the method body
            Matcher arrayMatcher = arrayPattern.matcher(body);
            while (arrayMatcher.find()) {
                String arrContent = arrayMatcher.group(1);
                
                // Check for negative numbers
                boolean hasNegative = negativePattern.matcher(arrContent).find();
                
                // Remove negative numbers and check for remaining positive numbers
                String withoutNegative = arrContent.replaceAll("-\\d+", "");
                boolean hasPositive = digitPattern.matcher(withoutNegative).find();
                
                // If array has BOTH positive AND negative, requirement is met
                if (hasNegative && hasPositive) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * REQUIREMENT 3: Zero Value Tests
     * 
     * WHAT WE'RE CHECKING:
     * The test suite must confirm correct handling of arrays containing
     * zero values in various positions.
     * 
     * WHY THIS MATTERS:
     * Zero is a special value that can cause:
     * - Division by zero errors (if used in calculations)
     * - Identity element issues (a + 0 = a)
     * - Sign determination problems (zero is neither positive nor negative)
     * 
     * DETECTION STRATEGY:
     * 1. Check method name for keyword: "zero"
     * 2. Check for 0 as an array element (not part of larger numbers like 10, 20)
     *    Valid patterns:
     *    - {0, ...}  - zero at start
     *    - {..., 0, ...} - zero in middle
     *    - {..., 0} - zero at end
     * 
     * @param tests Map of test method names to their body content
     * @return true if test for zero values exists
     */
    private static boolean checkRequirement3(Map<String, String> tests) {
        // Patterns to detect 0 as a standalone array element
        Pattern zeroAtStart = Pattern.compile("\\{\\s*0\\s*,");    // {0, ...
        Pattern zeroInMiddle = Pattern.compile(",\\s*0\\s*,");     // ..., 0, ...
        Pattern zeroAtEnd = Pattern.compile(",\\s*0\\s*\\}");      // ..., 0}
        
        for (Map.Entry<String, String> entry : tests.entrySet()) {
            String name = entry.getKey().toLowerCase();
            String body = entry.getValue();
            
            // CHECK 1: Method name contains "zero"
            if (name.contains("zero")) {
                return true;
            }
            
            // CHECK 2: Method body contains 0 as array element
            if (zeroAtStart.matcher(body).find() || 
                zeroInMiddle.matcher(body).find() || 
                zeroAtEnd.matcher(body).find()) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * REQUIREMENT 4: Integer Overflow and Underflow Tests
     * 
     * WHAT WE'RE CHECKING:
     * The test suite must include tests that exercise integer overflow and
     * underflow behavior based on Java int arithmetic.
     * 
     * WHY THIS MATTERS:
     * Java integers wrap around on overflow/underflow:
     * - Integer.MAX_VALUE + 1 = Integer.MIN_VALUE (overflow, wraps to negative)
     * - Integer.MIN_VALUE - 1 = Integer.MAX_VALUE (underflow, wraps to positive)
     * 
     * This can cause:
     * - Incorrect maximum sum calculations
     * - Security vulnerabilities
     * - Silent data corruption
     * 
     * DETECTION STRATEGY:
     * For overflow: Integer.MAX_VALUE adjacent to a positive number
     * For underflow: Integer.MIN_VALUE adjacent to a negative number
     * 
     * Patterns:
     * - Overflow: {Integer.MAX_VALUE, 1} or {1, Integer.MAX_VALUE}
     * - Underflow: {Integer.MIN_VALUE, -1} or {-1, Integer.MIN_VALUE}
     * 
     * @param tests Map of test method names to their body content
     * @return true if BOTH overflow AND underflow tests exist
     */
    private static boolean checkRequirement4(Map<String, String> tests) {
        boolean hasOverflowTest = false;
        boolean hasUnderflowTest = false;
        
        // Patterns for overflow detection
        // Integer.MAX_VALUE followed by positive number (causes overflow when summed)
        Pattern maxValueWithPositive1 = Pattern.compile("Integer\\.MAX_VALUE\\s*,\\s*[1-9]");
        Pattern maxValueWithPositive2 = Pattern.compile("[1-9]\\s*,\\s*Integer\\.MAX_VALUE");
        
        // Patterns for underflow detection
        // Integer.MIN_VALUE followed by negative number (causes underflow when summed)
        Pattern minValueWithNegative1 = Pattern.compile("Integer\\.MIN_VALUE\\s*,\\s*-[1-9]");
        Pattern minValueWithNegative2 = Pattern.compile("-[1-9]\\s*,\\s*Integer\\.MIN_VALUE");
        
        for (Map.Entry<String, String> entry : tests.entrySet()) {
            String name = entry.getKey().toLowerCase();
            String body = entry.getValue();
            
            // CHECK 1: Method name indicates overflow test
            if (name.contains("overflow")) {
                hasOverflowTest = true;
            }
            
            // CHECK 2: Method body has MAX_VALUE with positive addend
            if (body.contains("Integer.MAX_VALUE")) {
                if (maxValueWithPositive1.matcher(body).find() || 
                    maxValueWithPositive2.matcher(body).find()) {
                    hasOverflowTest = true;
                }
            }
            
            // CHECK 3: Method name indicates underflow test
            if (name.contains("underflow")) {
                hasUnderflowTest = true;
            }
            
            // CHECK 4: Method body has MIN_VALUE with negative addend
            if (body.contains("Integer.MIN_VALUE")) {
                if (minValueWithNegative1.matcher(body).find() || 
                    minValueWithNegative2.matcher(body).find()) {
                    hasUnderflowTest = true;
                }
            }
        }
        
        // BOTH conditions must be met
        return hasOverflowTest && hasUnderflowTest;
    }
    
    /**
     * REQUIREMENT 5: Boundary and Extreme Value Tests
     * 
     * WHAT WE'RE CHECKING:
     * The test suite must ensure consistent and well-defined behavior for
     * boundary and extreme input values to prevent future regressions.
     * 
     * WHY THIS MATTERS:
     * Boundary values are where bugs often hide:
     * - Integer.MAX_VALUE = 2,147,483,647 (largest 32-bit signed integer)
     * - Integer.MIN_VALUE = -2,147,483,648 (smallest 32-bit signed integer)
     * 
     * Testing these ensures:
     * - Algorithm handles extreme values correctly
     * - No assumptions about "reasonable" input ranges
     * - Regression protection for edge cases
     * 
     * DETECTION STRATEGY:
     * Simply check if the test suite uses:
     * - Integer.MAX_VALUE (tests upper boundary)
     * - Integer.MIN_VALUE (tests lower boundary)
     * 
     * @param tests Map of test method names to their body content
     * @return true if BOTH MAX_VALUE AND MIN_VALUE boundary tests exist
     */
    private static boolean checkRequirement5(Map<String, String> tests) {
        boolean hasMaxValueTest = false;
        boolean hasMinValueTest = false;
        
        for (String body : tests.values()) {
            // CHECK 1: Uses Integer.MAX_VALUE
            if (body.contains("Integer.MAX_VALUE")) {
                hasMaxValueTest = true;
            }
            
            // CHECK 2: Uses Integer.MIN_VALUE
            if (body.contains("Integer.MIN_VALUE")) {
                hasMinValueTest = true;
            }
        }
        
        // BOTH conditions must be met
        return hasMaxValueTest && hasMinValueTest;
    }
    
    // ========================================================================
    // SECTION 5: TEST COMPILATION AND EXECUTION
    // ========================================================================
    
    /**
     * Compiles and runs the JUnit tests in the target repository.
     * 
     * COMPILATION PROCESS:
     * 1. Locate source files (main/java and test/ directories)
     * 2. Set up classpath with JUnit and Hamcrest JARs
     * 3. Compile main source (AdjacentSum.java)
     * 4. Compile test source (AdjacentSumTest.java)
     * 5. Run JUnit test runner
     * 
     * DIRECTORY STRUCTURE EXPECTED:
     * repository_xxx/
     *   src/
     *     main/java/AdjacentSum.java
     *     test/AdjacentSumTest.java
     *   build/  (created for compiled classes)
     * lib/
     *   junit-4.13.2.jar
     *   hamcrest-core-1.3.jar
     * 
     * @param repoPath Repository to compile and test (e.g., "repository_after")
     * @return Object array: [Boolean success, String output]
     */
    private static Object[] compileAndRunTests(String repoPath) {
        String fullRepoPath = baseDir + File.separator + repoPath;
        String srcMain = fullRepoPath + File.separator + "src" + File.separator + "main" + File.separator + "java";
        String srcTest = fullRepoPath + File.separator + "src" + File.separator + "test";
        String libDir = baseDir + File.separator + "lib";
        String buildDir = fullRepoPath + File.separator + "build";
        
        // Check if JUnit JARs exist
        File junitJar = new File(libDir + File.separator + "junit-4.13.2.jar");
        File hamcrestJar = new File(libDir + File.separator + "hamcrest-core-1.3.jar");
        
        if (!junitJar.exists() || !hamcrestJar.exists()) {
            return new Object[]{null, "Compilation skipped - JUnit jars not available at " + libDir};
        }
        
        // Create build directory
        new File(buildDir).mkdirs();
        
        // Classpath separator (: for Unix, ; for Windows)
        String cpSep = File.pathSeparator;
        
        try {
            // STEP 1: Compile main source
            String[] compileMainCmd = {
                "javac", "-d", buildDir,
                srcMain + File.separator + "AdjacentSum.java"
            };
            
            ProcessBuilder pb1 = new ProcessBuilder(compileMainCmd);
            pb1.redirectErrorStream(true);
            Process p1 = pb1.start();
            String mainOutput = new String(p1.getInputStream().readAllBytes());
            int mainResult = p1.waitFor();
            
            if (mainResult != 0) {
                return new Object[]{false, "Failed to compile main source:\n" + mainOutput};
            }
            
            // STEP 2: Compile test source
            String classpath = buildDir + cpSep + junitJar.getPath() + cpSep + hamcrestJar.getPath();
            String[] compileTestCmd = {
                "javac", "-cp", classpath, "-d", buildDir,
                srcTest + File.separator + "AdjacentSumTest.java"
            };
            
            ProcessBuilder pb2 = new ProcessBuilder(compileTestCmd);
            pb2.redirectErrorStream(true);
            Process p2 = pb2.start();
            String testCompileOutput = new String(p2.getInputStream().readAllBytes());
            int testResult = p2.waitFor();
            
            if (testResult != 0) {
                return new Object[]{false, "Failed to compile test source:\n" + testCompileOutput};
            }
            
            // STEP 3: Run JUnit tests
            String[] runCmd = {
                "java", "-cp", classpath,
                "org.junit.runner.JUnitCore", "AdjacentSumTest"
            };
            
            ProcessBuilder pb3 = new ProcessBuilder(runCmd);
            pb3.redirectErrorStream(true);
            Process p3 = pb3.start();
            String runOutput = new String(p3.getInputStream().readAllBytes());
            p3.waitFor();
            
            // Check if all tests passed
            boolean allPassed = runOutput.contains("OK") && !runOutput.contains("FAILURES");
            
            return new Object[]{allPassed, runOutput};
            
        } catch (Exception e) {
            return new Object[]{false, "Exception during compilation/execution: " + e.getMessage()};
        }
    }
    
    // ========================================================================
    // SECTION 6: MAIN TEST RUNNER
    // ========================================================================
    
    /**
     * Runs all meta tests on the specified repository.
     * 
     * EXECUTION FLOW:
     * 1. Locate the test file (AdjacentSumTest.java)
     * 2. Parse the test file to extract test methods
     * 3. Check each of the 5 requirements
     * 4. Print detailed results for each requirement
     * 5. Optionally compile and run the actual JUnit tests
     * 6. Print final verdict (SUCCESS or FAILURE)
     * 
     * @param repoPath Repository to test (e.g., "repository_before" or "repository_after")
     * @return true if ALL requirements are met, false otherwise
     */
    private static boolean runMetaTests(String repoPath) {
        // Construct path to test file
        String testFilePath = baseDir + File.separator + repoPath + 
                              File.separator + "src" + File.separator + "test" + 
                              File.separator + "AdjacentSumTest.java";
        
        // Verify test file exists
        if (!new File(testFilePath).exists()) {
            System.out.println("Error: Test file not found at " + testFilePath);
            return false;
        }
        
        System.out.println("Analyzing test file: " + testFilePath);
        System.out.println("=".repeat(60));
        
        try {
            // STEP 1: Parse test file
            Map<String, String> tests = parseTestFile(testFilePath);
            
            System.out.println("Found " + tests.size() + " test methods:");
            for (String name : tests.keySet()) {
                System.out.println("  - " + name);
            }
            System.out.println("=".repeat(60));
            
            // STEP 2: Check each requirement
            List<String[]> results = new ArrayList<>();
            
            boolean req1Passed = checkRequirement1(tests);
            results.add(new String[]{"REQ-1: Empty and single-element arrays", req1Passed ? "PASS" : "FAIL"});
            
            boolean req2Passed = checkRequirement2(tests);
            results.add(new String[]{"REQ-2: Positive and negative integers", req2Passed ? "PASS" : "FAIL"});
            
            boolean req3Passed = checkRequirement3(tests);
            results.add(new String[]{"REQ-3: Arrays containing zero values", req3Passed ? "PASS" : "FAIL"});
            
            boolean req4Passed = checkRequirement4(tests);
            results.add(new String[]{"REQ-4: Integer overflow and underflow", req4Passed ? "PASS" : "FAIL"});
            
            boolean req5Passed = checkRequirement5(tests);
            results.add(new String[]{"REQ-5: Boundary and extreme values", req5Passed ? "PASS" : "FAIL"});
            
            // STEP 3: Print requirement coverage results
            System.out.println("\nRequirement Coverage Results:");
            System.out.println("-".repeat(60));
            
            int passedCount = 0;
            for (String[] result : results) {
                System.out.println("  " + result[0] + ": " + result[1]);
                if (result[1].equals("PASS")) {
                    passedCount++;
                }
            }
            
            System.out.println("-".repeat(60));
            System.out.println("Total: " + passedCount + "/" + results.size() + " requirements covered");
            System.out.println("=".repeat(60));
            
            // STEP 4: Compile and run JUnit tests (optional)
            System.out.println("\nCompiling and running JUnit tests...");
            System.out.println("-".repeat(60));
            
            Object[] testResult = compileAndRunTests(repoPath);
            Boolean testsPassed = (Boolean) testResult[0];
            String testOutput = (String) testResult[1];
            
            if (testOutput != null && !testOutput.isEmpty()) {
                System.out.println("Test execution output:");
                for (String line : testOutput.split("\n")) {
                    System.out.println("  " + line);
                }
            }
            
            System.out.println("-".repeat(60));
            
            if (testsPassed == null) {
                System.out.println("JUnit tests: SKIPPED (environment not configured)");
            } else if (testsPassed) {
                System.out.println("JUnit tests: ALL PASSED");
            } else {
                System.out.println("JUnit tests: SOME FAILED (or compilation error)");
            }
            
            System.out.println("=".repeat(60));
            
            // STEP 5: Final verdict
            boolean allRequirementsMet = req1Passed && req2Passed && req3Passed && req4Passed && req5Passed;
            
            System.out.println("\nFinal Verdict:");
            if (allRequirementsMet) {
                System.out.println("  SUCCESS: All requirements are covered by the test suite.");
            } else {
                System.out.println("  FAILURE: Not all requirements are covered by the test suite.");
                StringBuilder missing = new StringBuilder("  Missing coverage for: ");
                List<String> missingReqs = new ArrayList<>();
                if (!req1Passed) missingReqs.add("REQ-1");
                if (!req2Passed) missingReqs.add("REQ-2");
                if (!req3Passed) missingReqs.add("REQ-3");
                if (!req4Passed) missingReqs.add("REQ-4");
                if (!req5Passed) missingReqs.add("REQ-5");
                System.out.println(missing + String.join(", ", missingReqs));
            }
            
            return allRequirementsMet;
            
        } catch (IOException e) {
            System.out.println("Error reading test file: " + e.getMessage());
            return false;
        }
    }
}

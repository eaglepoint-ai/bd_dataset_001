import org.junit.Test;
import static org.junit.Assert.*;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList;
import java.util.List;

public class MetaTest {
    
    // ========================================================================
    // SECTION 1: CLASS CONSTANTS
    // ========================================================================
    
    /** 
     * Minimum number of test methods required for full coverage.
     * The repository_after should have at least 10 tests to cover all scenarios.
     */
    private static final int MINIMUM_REQUIRED_TESTS = 10;
    
    /** 
     * Reference to the AdjacentSumTest class being analyzed.
     * This is loaded dynamically to allow testing different versions.
     */
    private static Class<?> testClass;
    
    /** Set of all test method names (lowercase for case-insensitive matching) */
    private static Set<String> testMethodNames;
    
    /** List to track which requirements passed/failed */
    private static List<String[]> requirementResults;
    
    // ========================================================================
    // SECTION 2: STATIC INITIALIZATION
    // ========================================================================
    
    static {
        try {
            // Step 1: Load the test class dynamically
            // This allows testing different versions of AdjacentSumTest
            testClass = Class.forName("AdjacentSumTest");
            
            // Step 2: Get all declared methods using reflection
            Method[] methods = testClass.getDeclaredMethods();
            
            // Step 3: Filter and collect @Test annotated method names
            testMethodNames = new HashSet<>();
            for (Method method : methods) {
                // Check if method has @Test annotation
                if (method.isAnnotationPresent(Test.class)) {
                    // Store lowercase name for case-insensitive matching
                    testMethodNames.add(method.getName().toLowerCase());
                }
            }
            
            // Initialize results tracking
            requirementResults = new ArrayList<>();
            
        } catch (ClassNotFoundException e) {
            // If AdjacentSumTest is not on classpath, tests will fail gracefully
            testClass = null;
            testMethodNames = new HashSet<>();
            requirementResults = new ArrayList<>();
            System.err.println("WARNING: AdjacentSumTest class not found on classpath");
        }
    }
    
    // ========================================================================
    // SECTION 3: MAIN ENTRY POINT (Standalone Execution)
    // ========================================================================
    
    public static void main(String[] args) {
        System.out.println("\n" + "=".repeat(70));
        System.out.println("META-TEST: AdjacentSumTest Coverage Analysis (Reflection-Based)");
        System.out.println("=".repeat(70));
        
        // Check if test class was loaded successfully
        if (testClass == null) {
            System.out.println("\nERROR: AdjacentSumTest class not found!");
            System.out.println("Make sure AdjacentSumTest.class is on the classpath.");
            System.exit(1);
        }
        
        // Print discovered test methods
        System.out.println("\nAnalyzing class: " + testClass.getName());
        System.out.println("Found " + testMethodNames.size() + " @Test methods:");
        System.out.println("-".repeat(70));
        
        // Get actual method names (not lowercase) for display
        for (Method method : testClass.getDeclaredMethods()) {
            if (method.isAnnotationPresent(Test.class)) {
                System.out.println("  - " + method.getName() + "()");
            }
        }
        
        System.out.println("-".repeat(70));
        
        // Create instance and run checks
        MetaTest metaTest = new MetaTest();
        
        // Clear previous results
        requirementResults.clear();
        
        // Run all requirement checks
        System.out.println("\nRequirement Coverage Analysis:");
        System.out.println("-".repeat(70));
        
        boolean req1 = metaTest.checkRequirement1_EmptyAndSingleElement();
        boolean req2 = metaTest.checkRequirement2_MixedPositiveNegative();
        boolean req3 = metaTest.checkRequirement3_ZeroValues();
        boolean req4 = metaTest.checkRequirement4_OverflowUnderflow();
        boolean req5 = metaTest.checkRequirement5_BoundaryValues();
        boolean reqCount = metaTest.checkMinimumTestCount();
        
        // Print results summary
        System.out.println("\n" + "-".repeat(70));
        System.out.println("RESULTS SUMMARY:");
        System.out.println("-".repeat(70));
        
        for (String[] result : requirementResults) {
            String status = result[1].equals("PASS") ? "PASS" : "FAIL";
            System.out.println("  " + status + " - " + result[0]);
        }
        
        // Calculate overall result
        int passedCount = 0;
        for (String[] result : requirementResults) {
            if (result[1].equals("PASS")) passedCount++;
        }
        
        System.out.println("-".repeat(70));
        System.out.println("Total: " + passedCount + "/" + requirementResults.size() + " checks passed");
        System.out.println("=".repeat(70));
        
        // Final verdict (requirements 1-5 must all pass)
        boolean allRequirementsPassed = req1 && req2 && req3 && req4 && req5;
        
        System.out.println("\nFINAL VERDICT:");
        if (allRequirementsPassed) {
            System.out.println("  SUCCESS: All requirements are covered by the test suite.");
            System.exit(0);
        } else {
            System.out.println("  FAILURE: Not all requirements are covered by the test suite.");
            
            // List missing requirements
            System.out.print("  Missing: ");
            List<String> missing = new ArrayList<>();
            if (!req1) missing.add("REQ-1 (Empty/Single)");
            if (!req2) missing.add("REQ-2 (Mixed +/-)");
            if (!req3) missing.add("REQ-3 (Zeros)");
            if (!req4) missing.add("REQ-4 (Overflow/Underflow)");
            if (!req5) missing.add("REQ-5 (Boundaries)");
            System.out.println(String.join(", ", missing));
            
            System.exit(1);
        }
    }
    
    // ========================================================================
    // SECTION 4: REQUIREMENT 1 - Empty and Single-Element Arrays
    // ========================================================================
    
    private boolean checkRequirement1_EmptyAndSingleElement() {
        // Check for "empty" in any test method name
        boolean hasEmptyArrayTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("empty"));
        
        // Check for "single" in any test method name
        boolean hasSingleElementTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("single"));
        
        // Record result
        boolean passed = hasEmptyArrayTest && hasSingleElementTest;
        requirementResults.add(new String[]{
            "REQ-1: Empty and single-element arrays", 
            passed ? "PASS" : "FAIL"
        });
        
        // Print detailed status
        System.out.println("  REQ-1: Empty and single-element arrays");
        System.out.println("         - Empty array test: " + (hasEmptyArrayTest ? "Found" : "MISSING"));
        System.out.println("         - Single element test: " + (hasSingleElementTest ? "Found" : "MISSING"));
        System.out.println("         Result: " + (passed ? "PASS" : "FAIL"));
        
        return passed;
    }
    
    /**
     * JUnit test method for Requirement 1.
     * This is called when running via JUnit runner.
     */
    @Test
    public void testRequirement1_EmptyAndSingleElementArrays() {
        assertNotNull("AdjacentSumTest class not found", testClass);
        
        boolean hasEmptyArrayTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("empty"));
        boolean hasSingleElementTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("single"));
        
        assertTrue("Missing test for empty array (Requirement 1)", hasEmptyArrayTest);
        assertTrue("Missing test for single element array (Requirement 1)", hasSingleElementTest);
    }
    
    // ========================================================================
    // SECTION 5: REQUIREMENT 2 - Mixed Positive and Negative Integers
    // ========================================================================
    
    private boolean checkRequirement2_MixedPositiveNegative() {
        boolean hasMixedSignTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("mixed") || 
                             (name.contains("negative") && name.contains("positive")));
        
        // Also check for explicit mixed naming
        boolean hasExplicitMixedTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("mixedpositive") || 
                             name.contains("mixednegative") ||
                             name.contains("positivenegative") ||
                             name.contains("negativepositive"));
        
        boolean passed = hasMixedSignTest || hasExplicitMixedTest;
        requirementResults.add(new String[]{
            "REQ-2: Mixed positive and negative integers", 
            passed ? "PASS" : "FAIL"
        });
        
        System.out.println("  REQ-2: Mixed positive and negative integers");
        System.out.println("         - Mixed sign test: " + (passed ? "Found" : "MISSING"));
        System.out.println("         Result: " + (passed ? "PASS" : "FAIL"));
        
        return passed;
    }
    
    /**
     * JUnit test method for Requirement 2.
     */
    @Test
    public void testRequirement2_MixedPositiveNegativeIntegers() {
        assertNotNull("AdjacentSumTest class not found", testClass);
        
        boolean hasMixedSignTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("mixed") || 
                             (name.contains("negative") && name.contains("positive")));
        
        assertTrue("Missing test for mixed positive/negative integers (Requirement 2)", 
                   hasMixedSignTest);
    }
    
    // ========================================================================
    // SECTION 6: REQUIREMENT 3 - Zero Values
    // ========================================================================
    
    private boolean checkRequirement3_ZeroValues() {
        boolean hasZeroTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("zero"));
        
        requirementResults.add(new String[]{
            "REQ-3: Arrays containing zero values", 
            hasZeroTest ? "PASS" : "FAIL"
        });
        
        System.out.println("  REQ-3: Arrays containing zero values");
        System.out.println("         - Zero values test: " + (hasZeroTest ? "Found" : "MISSING"));
        System.out.println("         Result: " + (hasZeroTest ? "PASS" : "FAIL"));
        
        return hasZeroTest;
    }
    
    /**
     * JUnit test method for Requirement 3.
     */
    @Test
    public void testRequirement3_ZeroValues() {
        assertNotNull("AdjacentSumTest class not found", testClass);
        
        boolean hasZeroTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("zero"));
        
        assertTrue("Missing test for zero values (Requirement 3)", hasZeroTest);
    }
    
    // ========================================================================
    // SECTION 7: REQUIREMENT 4 - Integer Overflow and Underflow
    // ========================================================================

    private boolean checkRequirement4_OverflowUnderflow() {
        boolean hasOverflowTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("overflow"));
        
        boolean hasUnderflowTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("underflow"));
        
        boolean passed = hasOverflowTest && hasUnderflowTest;
        requirementResults.add(new String[]{
            "REQ-4: Integer overflow and underflow", 
            passed ? "PASS" : "FAIL"
        });
        
        System.out.println("  REQ-4: Integer overflow and underflow");
        System.out.println("         - Overflow test: " + (hasOverflowTest ? "Found" : "MISSING"));
        System.out.println("         - Underflow test: " + (hasUnderflowTest ? "Found" : "MISSING"));
        System.out.println("         Result: " + (passed ? "PASS" : "FAIL"));
        
        return passed;
    }
    
    /**
     * JUnit test method for Requirement 4.
     */
    @Test
    public void testRequirement4_IntegerOverflowUnderflow() {
        assertNotNull("AdjacentSumTest class not found", testClass);
        
        boolean hasOverflowTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("overflow"));
        boolean hasUnderflowTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("underflow"));
        
        assertTrue("Missing test for integer overflow (Requirement 4)", hasOverflowTest);
        assertTrue("Missing test for integer underflow (Requirement 4)", hasUnderflowTest);
    }
    
    // ========================================================================
    // SECTION 8: REQUIREMENT 5 - Boundary and Extreme Values
    // ========================================================================
    
    private boolean checkRequirement5_BoundaryValues() {
        boolean hasMaxValueTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("max"));
        
        boolean hasMinValueTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("min"));
        
        boolean passed = hasMaxValueTest && hasMinValueTest;
        requirementResults.add(new String[]{
            "REQ-5: Boundary and extreme values", 
            passed ? "PASS" : "FAIL"
        });
        
        System.out.println("  REQ-5: Boundary and extreme values");
        System.out.println("         - MAX_VALUE test: " + (hasMaxValueTest ? "Found" : "MISSING"));
        System.out.println("         - MIN_VALUE test: " + (hasMinValueTest ? "Found" : "MISSING"));
        System.out.println("         Result: " + (passed ? "PASS" : "FAIL"));
        
        return passed;
    }
    
    /**
     * JUnit test method for Requirement 5.
     */
    @Test
    public void testRequirement5_BoundaryValues() {
        assertNotNull("AdjacentSumTest class not found", testClass);
        
        boolean hasMaxValueTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("max"));
        boolean hasMinValueTest = testMethodNames.stream()
            .anyMatch(name -> name.contains("min"));
        
        assertTrue("Missing test for MAX_VALUE boundary (Requirement 5)", hasMaxValueTest);
        assertTrue("Missing test for MIN_VALUE boundary (Requirement 5)", hasMinValueTest);
    }
    
    // ========================================================================
    // SECTION 9: MINIMUM TEST COUNT CHECK
    // ========================================================================
    
    private boolean checkMinimumTestCount() {
        int testCount = testMethodNames.size();
        boolean passed = testCount >= MINIMUM_REQUIRED_TESTS;
        
        requirementResults.add(new String[]{
            "Minimum test count (>=" + MINIMUM_REQUIRED_TESTS + ")", 
            passed ? "PASS" : "FAIL"
        });
        
        System.out.println("  Minimum test count check:");
        System.out.println("         - Found: " + testCount + " tests");
        System.out.println("         - Required: >= " + MINIMUM_REQUIRED_TESTS + " tests");
        System.out.println("         Result: " + (passed ? "PASS" : "FAIL"));
        
        return passed;
    }
    
    /**
     * JUnit test method for minimum test count.
     */
    @Test
    public void testMinimumNumberOfTests() {
        assertNotNull("AdjacentSumTest class not found", testClass);
        
        long testCount = testMethodNames.size();
        
        assertTrue("Test suite should have at least " + MINIMUM_REQUIRED_TESTS + 
                   " tests for full coverage, but found only " + testCount, 
                   testCount >= MINIMUM_REQUIRED_TESTS);
    }
    
    // ========================================================================
    // SECTION 10: BEHAVIOR-BASED META-TESTS (Optional)
    // ========================================================================

    @Test
    public void metaTest_EmptyArrayTestExists() {
        try {
            // Try to find and invoke testEmptyArray
            Object testInstance = testClass.getDeclaredConstructor().newInstance();
            Method emptyArrayTest = testClass.getMethod("testEmptyArray");
            emptyArrayTest.invoke(testInstance);
            // If we get here, the test exists and runs
        } catch (NoSuchMethodException e) {
            fail("Test suite missing testEmptyArray() - Requirement 1 not covered");
        } catch (Exception e) {
            // Other exceptions are OK - the method exists but might have assertions
            // that fail (which is expected behavior for a test)
        }
    }
    
    @Test
    public void metaTest_OverflowTestExists() {
        try {
            Object testInstance = testClass.getDeclaredConstructor().newInstance();
            Method overflowTest = testClass.getMethod("testIntegerOverflow");
            overflowTest.invoke(testInstance);
        } catch (NoSuchMethodException e) {
            fail("Test suite missing testIntegerOverflow() - Requirement 4 not covered");
        } catch (Exception e) {
            // Method exists
        }
    }
    
    @Test
    public void metaTest_UnderflowTestExists() {
        try {
            Object testInstance = testClass.getDeclaredConstructor().newInstance();
            Method underflowTest = testClass.getMethod("testIntegerUnderflow");
            underflowTest.invoke(testInstance);
        } catch (NoSuchMethodException e) {
            fail("Test suite missing testIntegerUnderflow() - Requirement 4 not covered");
        } catch (Exception e) {
            // Method exists
        }
    }
    
    @Test
    public void metaTest_ZeroValuesTestExists() {
        try {
            Object testInstance = testClass.getDeclaredConstructor().newInstance();
            Method zeroTest = testClass.getMethod("testArrayWithZeros");
            zeroTest.invoke(testInstance);
        } catch (NoSuchMethodException e) {
            fail("Test suite missing testArrayWithZeros() - Requirement 3 not covered");
        } catch (Exception e) {
            // Method exists
        }
    }
    
    @Test
    public void metaTest_MixedPositiveNegativeTestExists() {
        try {
            Object testInstance = testClass.getDeclaredConstructor().newInstance();
            Method mixedTest = testClass.getMethod("testMixedPositiveAndNegative");
            mixedTest.invoke(testInstance);
        } catch (NoSuchMethodException e) {
            fail("Test suite missing testMixedPositiveAndNegative() - Requirement 2 not covered");
        } catch (Exception e) {
            // Method exists
        }
    }
}

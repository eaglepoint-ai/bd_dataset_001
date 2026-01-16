package com.logparser;
// import main.log_parser.repository_after.LogParser;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Standalone test runner to avoid external dependencies like JUnit.
 * This version is designed to be compatible with both the original List-returning 
 * LogParser and the optimized Map-returning LogParser.
 */
public class ComprehensiveTests {

    public static void main(String[] args) {
        System.out.println("Running Comprehensive Tests...");
        int passed = 0;
        int failed = 0;

        // List of tests to run
        Map<String, Runnable> tests = new LinkedHashMap<>();
        tests.put("testStandardErrorExtraction", ComprehensiveTests::testStandardErrorExtraction);
        tests.put("testMultipleErrorsSameType", ComprehensiveTests::testMultipleErrorsSameType);
        tests.put("testMultipleDifferentErrors", ComprehensiveTests::testMultipleDifferentErrors);
        tests.put("testNoErrors", ComprehensiveTests::testNoErrors);
        tests.put("testEmptyList", ComprehensiveTests::testEmptyList);
        tests.put("testNullList", ComprehensiveTests::testNullList);
        tests.put("testListWithNullsAndEmpties", ComprehensiveTests::testListWithNullsAndEmpties);
        tests.put("testMalformedLines", ComprehensiveTests::testMalformedLines);
        tests.put("testErrorAtStartOfLine", ComprehensiveTests::testErrorAtStartOfLine);
        tests.put("testErrorAtEndOfLine", ComprehensiveTests::testErrorAtEndOfLine);
        tests.put("testErrorSurroundedBySpaces", ComprehensiveTests::testErrorSurroundedBySpaces);
        tests.put("testErrorEmbeddedInWord", ComprehensiveTests::testErrorEmbeddedInWord); 

        for (Map.Entry<String, Runnable> entry : tests.entrySet()) {
            System.out.print("Test: " + entry.getKey() + " ... ");
            try {
                entry.getValue().run();
                System.out.println("PASSED");
                passed++;
            } catch (Throwable t) {
                System.out.println("FAILED");
                // t.printStackTrace(); // Optional: debug failure
                failed++;
            }
        }

        System.out.println("\nSummary: " + passed + " passed, " + failed + " failed.");
        System.exit(failed == 0 ? 0 : 1);
    }

    // --- Helper to handle both List and Map return types ---
    @SuppressWarnings("unchecked")
    private static Map<String, Integer> getResultAsMap(List<String> logs) {
        Object result = LogParser.parseLogs(logs);
        if (result instanceof Map) {
            return (Map<String, Integer>) result;
        } else if (result instanceof List) {
            // Convert list of lines to error counts for backward compatibility in tests
            Map<String, Integer> counts = new HashMap<>();
            for (String line : (List<String>) result) {
                // Heuristic: extracting error token from the line to match test expectations
                int idx = line.indexOf("ERROR");
                if (idx != -1) {
                    int end = idx;
                    while (end < line.length() && !Character.isWhitespace(line.charAt(end))) end++;
                    String token = line.substring(idx, end);
                    counts.put(token, counts.getOrDefault(token, 0) + 1);
                }
            }
            return counts;
        }
        return new HashMap<>();
    }

    // --- Test Cases ---

    private static void testStandardErrorExtraction() {
        List<String> logs = Arrays.asList("2024-01-01 ERROR_TIMEOUT Connection timed out");
        Map<String, Integer> result = getResultAsMap(logs);
        assertEquals(1, result.get("ERROR_TIMEOUT"));
    }

    private static void testMultipleErrorsSameType() {
        List<String> logs = Arrays.asList("ERROR_IO", "Checking...", "ERROR_IO again");
        Map<String, Integer> result = getResultAsMap(logs);
        assertEquals(2, result.get("ERROR_IO"));
    }

    private static void testMultipleDifferentErrors() {
        List<String> logs = Arrays.asList("ERROR_A", "ERROR_B", "ERROR_A");
        Map<String, Integer> result = getResultAsMap(logs);
        assertEquals(2, result.get("ERROR_A"));
        assertEquals(1, result.get("ERROR_B"));
    }

    private static void testNoErrors() {
        List<String> logs = Arrays.asList("INFO starts", "DEBUG details", "WARN warning");
        Map<String, Integer> result = getResultAsMap(logs);
        if (result != null && !result.isEmpty()) throw new RuntimeException("Expected empty map");
    }

    private static void testEmptyList() {
        if (!getResultAsMap(new ArrayList<>()).isEmpty()) throw new RuntimeException("Failed empty list");
    }

    private static void testNullList() {
        if (!getResultAsMap(null).isEmpty()) throw new RuntimeException("Failed null list");
    }

    private static void testListWithNullsAndEmpties() {
        List<String> logs = new ArrayList<>();
        logs.add(null); logs.add(""); logs.add("   ");
        if (!getResultAsMap(logs).isEmpty()) throw new RuntimeException("Failed null/empty elements");
    }

    private static void testMalformedLines() {
        List<String> logs = Arrays.asList("ERROR", "ERROR_", " ERROR ", "Something ERROR_CODE something");
        Map<String, Integer> result = getResultAsMap(logs);
        assertEquals(2, result.get("ERROR"));
        assertEquals(1, result.get("ERROR_"));
        assertEquals(1, result.get("ERROR_CODE"));
    }

    private static void testErrorAtStartOfLine() {
        Map<String, Integer> result = getResultAsMap(Arrays.asList("ERROR_START"));
        assertEquals(1, result.get("ERROR_START"));
    }

    private static void testErrorAtEndOfLine() {
        Map<String, Integer> result = getResultAsMap(Arrays.asList("Something ERROR_END"));
        assertEquals(1, result.get("ERROR_END"));
    }

    private static void testErrorSurroundedBySpaces() {
        Map<String, Integer> result = getResultAsMap(Arrays.asList("  ERROR_SPACE  "));
        assertEquals(1, result.get("ERROR_SPACE"));
    }

    private static void testErrorEmbeddedInWord() {
        Map<String, Integer> result = getResultAsMap(Arrays.asList("PREFIX_ERROR_SUFFIX"));
        // Based on extraction logic, it should find "ERROR_SUFFIX"
        assertEquals(1, result.get("ERROR_SUFFIX"));
    }

    // --- Assertions ---
    private static void assertEquals(int expected, Integer actual) {
        if (actual == null) throw new RuntimeException("Expected " + expected + " but got null");
        if (expected != actual) throw new RuntimeException("Expected " + expected + " but got " + actual);
    }
}

package com.logparser;


import java.io.*;
import java.net.InetAddress;
import java.nio.file.*;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

public class Evaluation {

    public static void main(String[] args) {
        String runId = UUID.randomUUID().toString().substring(0, 8);
        OffsetDateTime startedAt = OffsetDateTime.now();
        
        System.out.println("Run ID: " + runId);
        System.out.println("Started at: " + startedAt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        
        try {
            EvaluationResults results = runEvaluation();
            
            OffsetDateTime finishedAt = OffsetDateTime.now();
            double duration = (finishedAt.toInstant().toEpochMilli() - startedAt.toInstant().toEpochMilli()) / 1000.0;
            
            Map<String, String> environment = getEnvironmentInfo();
            
            // Output path as requested by user
            String reportPath = "evaluation/2026-01-15/18-13-01/report.json";
            generateReport(runId, startedAt, finishedAt, duration, results, environment, reportPath);
            
            System.out.println("\n============================================================");
            System.out.println("EVALUATION COMPLETE");
            System.out.println("============================================================");
            System.out.println("Run ID: " + runId);
            System.out.println("Duration: " + String.format("%.2fs", duration));
            System.out.println("Success: " + (results.after.success ? "✅ YES" : "❌ NO"));
            
            System.exit(results.after.success ? 0 : 1);
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static Map<String, String> getEnvironmentInfo() {
        Map<String, String> env = new LinkedHashMap<>();
        env.put("java_version", System.getProperty("java.version"));
        env.put("platform", System.getProperty("os.name") + "-" + System.getProperty("os.version"));
        env.put("os", System.getProperty("os.name"));
        env.put("os_release", System.getProperty("os.version"));
        env.put("architecture", System.getProperty("os.arch"));
        try {
            env.put("hostname", InetAddress.getLocalHost().getHostName());
        } catch (Exception e) {
            env.put("hostname", "unknown");
        }
        
        env.put("git_commit", getGitInfo("rev-parse", "HEAD"));
        env.put("git_branch", getGitInfo("rev-parse", "--abbrev-ref", "HEAD"));
        
        return env;
    }

    private static String getGitInfo(String... args) {
        try {
            List<String> cmd = new ArrayList<>();
            cmd.add("git");
            Collections.addAll(cmd, args);
            Process p = new ProcessBuilder(cmd).start();
            try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                String line = r.readLine();
                if (line != null) {
                    String full = line.trim();
                    return full.substring(0, Math.min(full.length(), 8));
                }
            }
        } catch (Exception e) {
            // ignore
        }
        return "unknown";
    }

    private static EvaluationResults runEvaluation() throws Exception {
        System.out.println("\n" + "=".repeat(60));
        System.out.println("MECHANICAL REFACTOR EVALUATION (JAVA)");
        System.out.println("=".repeat(60));

        Path projectRoot = Paths.get(System.getProperty("user.dir"));
        
        Path testsDir = projectRoot.resolve("tests");
        Path beforeRepo = projectRoot.resolve("repository_before");
        Path afterRepo = projectRoot.resolve("repository_after");
        
        TestResult before = runTests(beforeRepo, testsDir, "before (repository_before)");
        TestResult after = runTests(afterRepo, testsDir, "after (repository_after)");
        
        Map<String, Object> comparison = new LinkedHashMap<>();
        comparison.put("before_tests_passed", before.success);
        comparison.put("after_tests_passed", after.success);
        comparison.put("before_total", before.summary.get("total"));
        comparison.put("before_passed", before.summary.get("passed"));
        comparison.put("before_failed", before.summary.get("failed"));
        comparison.put("after_total", after.summary.get("total"));
        comparison.put("after_passed", after.summary.get("passed"));
        comparison.put("after_failed", after.summary.get("failed"));
        
        return new EvaluationResults(before, after, comparison);
    }

    private static TestResult runTests(Path repoPath, Path testsDir, String label) throws Exception {
        System.out.println("\n" + "=".repeat(60));
        System.out.println("RUNNING TESTS: " + label.toUpperCase());
        System.out.println("=".repeat(60));
        
        Path projectRoot = Paths.get(System.getProperty("user.dir"));
        Path tempBin = projectRoot.resolve("bin_eval_" + (label.contains("before") ? "before" : "after"));
        
        if (Files.exists(tempBin)) {
            Files.walk(tempBin).sorted(Comparator.reverseOrder()).map(Path::toFile).forEach(File::delete);
        }
        Files.createDirectories(tempBin);
        
        // 1. Compile
        List<String> compileCmd = new ArrayList<>(Arrays.asList("javac", "-d", tempBin.toString()));
        compileCmd.add(repoPath.resolve("LogParser.java").toString());
        compileCmd.add(testsDir.resolve("ComprehensiveTests.java").toString());
        
        Process compileProc = new ProcessBuilder(compileCmd).redirectErrorStream(true).start();
        String compileOutput = readStream(compileProc.getInputStream());
        int compileCode = compileProc.waitFor();
        
        if (compileCode != 0) {
            System.out.println("❌ Compilation failed");
            return new TestResult(false, compileCode, new ArrayList<>(), new HashMap<>(), compileOutput, "");
        }
        
        // 2. Run
        Process runProc = new ProcessBuilder("java", "-cp", tempBin.toString(), "com.logparser.ComprehensiveTests")
                .redirectErrorStream(false)
                .start();
        
        String stdout = readStream(runProc.getInputStream());
        String stderr = readStream(runProc.getErrorStream());
        int exitCode = runProc.waitFor();
        
        List<Map<String, String>> tests = parseOutput(stdout);
        Map<String, Integer> summary = new LinkedHashMap<>();
        summary.put("total", tests.size());
        summary.put("passed", (int) tests.stream().filter(t -> t.get("outcome").equals("passed")).count());
        summary.put("failed", (int) tests.stream().filter(t -> t.get("outcome").equals("failed")).count());
        summary.put("errors", 0);
        summary.put("skipped", 0);
        
        System.out.println("\nResults: " + summary.get("passed") + " passed, " + summary.get("failed") + " failed (total: " + tests.size() + ")");
        for (Map<String, String> test : tests) {
            String icon = test.get("outcome").equals("passed") ? "✅" : "❌";
            System.out.println("  " + icon + " " + test.get("nodeid") + ": " + test.get("outcome"));
        }
        
        return new TestResult(exitCode == 0, exitCode, tests, summary, stdout, stderr);
    }

    private static List<Map<String, String>> parseOutput(String stdout) {
        List<Map<String, String>> tests = new ArrayList<>();
        String[] lines = stdout.split("\n");
        for (String line : lines) {
            if (line.startsWith("Test: ")) {
                int start = 6;
                int end = line.indexOf(" ...");
                if (end != -1) {
                    String nodeid = line.substring(start, end).trim();
                    String outcome = line.contains("PASSED") ? "passed" : "failed";
                    Map<String, String> t = new LinkedHashMap<>();
                    t.put("nodeid", nodeid);
                    t.put("name", nodeid);
                    t.put("outcome", outcome);
                    tests.add(t);
                }
            }
        }
        return tests;
    }

    private static String readStream(InputStream is) throws IOException {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(is))) {
            return r.lines().collect(Collectors.joining("\n"));
        }
    }

    private static void generateReport(String runId, OffsetDateTime startedAt, OffsetDateTime finishedAt, double duration, EvaluationResults results, Map<String, String> environment, String reportPath) throws IOException {
        Path reportFile = Paths.get(reportPath);
        Files.createDirectories(reportFile.getParent());
        
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"run_id\": \"").append(runId).append("\",\n");
        json.append("  \"started_at\": \"").append(startedAt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)).append("\",\n");
        json.append("  \"finished_at\": \"").append(finishedAt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)).append("\",\n");
        json.append("  \"duration_seconds\": ").append(duration).append(",\n");
        json.append("  \"success\": ").append(results.after.success).append(",\n");
        json.append("  \"error\": ").append(results.after.success ? "null" : "\"After implementation tests failed\"").append(",\n");
        
        json.append("  \"environment\": {\n");
        int count = 0;
        for (Map.Entry<String, String> e : environment.entrySet()) {
            json.append("    \"").append(e.getKey()).append("\": \"").append(e.getValue()).append("\"");
            if (++count < environment.size()) json.append(",");
            json.append("\n");
        }
        json.append("  },\n");
        
        json.append("  \"results\": {\n");
        json.append("    \"before\": ").append(testResultToJson(results.before)).append(",\n");
        json.append("    \"after\": ").append(testResultToJson(results.after)).append(",\n");
        json.append("    \"comparison\": {\n");
        count = 0;
        for (Map.Entry<String, Object> e : results.comparison.entrySet()) {
            json.append("      \"").append(e.getKey()).append("\": ").append(e.getValue());
            if (++count < results.comparison.size()) json.append(",");
            json.append("\n");
        }
        json.append("    }\n");
        json.append("  }\n");
        json.append("}\n");
        
        Files.write(reportFile, json.toString().getBytes());
        System.out.println("\n✅ Report saved to: " + reportFile.toAbsolutePath());
    }

    private static String testResultToJson(TestResult tr) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("      \"success\": ").append(tr.success).append(",\n");
        sb.append("      \"exit_code\": ").append(tr.exitCode).append(",\n");
        sb.append("      \"tests\": [\n");
        for (int i = 0; i < tr.tests.size(); i++) {
            Map<String, String> t = tr.tests.get(i);
            sb.append("        {\n");
            sb.append("          \"nodeid\": \"").append(t.get("nodeid")).append("\",\n");
            sb.append("          \"name\": \"").append(t.get("name")).append("\",\n");
            sb.append("          \"outcome\": \"").append(t.get("outcome")).append("\"\n");
            sb.append("        }");
            if (i < tr.tests.size() - 1) sb.append(",");
            sb.append("\n");
        }
        sb.append("      ],\n");
        sb.append("      \"summary\": {\n");
        sb.append("        \"total\": ").append(tr.summary.get("total")).append(",\n");
        sb.append("        \"passed\": ").append(tr.summary.get("passed")).append(",\n");
        sb.append("        \"failed\": ").append(tr.summary.get("failed")).append(",\n");
        sb.append("        \"errors\": ").append(tr.summary.get("errors")).append(",\n");
        sb.append("        \"skipped\": ").append(tr.summary.get("skipped")).append("\n");
        sb.append("      },\n");
        sb.append("      \"stdout\": \"").append(escape(tr.stdout)).append("\",\n");
        sb.append("      \"stderr\": \"").append(escape(tr.stderr)).append("\"\n");
        sb.append("    }");
        return sb.toString();
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }

    static class EvaluationResults {
        TestResult before, after;
        Map<String, Object> comparison;
        EvaluationResults(TestResult b, TestResult a, Map<String, Object> c) { before = b; after = a; comparison = c; }
    }

    static class TestResult {
        boolean success;
        int exitCode;
        List<Map<String, String>> tests;
        Map<String, Integer> summary;
        String stdout, stderr;
        TestResult(boolean s, int e, List<Map<String, String>> t, Map<String, Integer> sum, String out, String err) {
            success = s; exitCode = e; tests = t; summary = sum; stdout = out; stderr = err;
        }
    }
}

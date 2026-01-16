// Evaluation runner for Go Excel Data Extractor.
//
// This evaluation script:
// - Runs go test on the tests/ folder
// - Collects individual test results with pass/fail status
// - Generates structured reports with environment metadata
//
// Run with:
//     go run evaluation/evaluation.go [options]

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"time"
)

type TestResult struct {
	NodeID  string `json:"nodeid"`
	Name    string `json:"name"`
	Outcome string `json:"outcome"`
}

type TestSummary struct {
	Total   int `json:"total"`
	Passed  int `json:"passed"`
	Failed  int `json:"failed"`
	Skipped int `json:"skipped"`
}

type TestRunResult struct {
	Success  bool         `json:"success"`
	ExitCode int          `json:"exit_code"`
	Tests    []TestResult `json:"tests"`
	Summary  TestSummary  `json:"summary"`
	Stdout   string       `json:"stdout"`
	Stderr   string       `json:"stderr"`
}

type Comparison struct {
	BeforeTestsPassed bool `json:"before_tests_passed"`
	AfterTestsPassed  bool `json:"after_tests_passed"`
	BeforeTotal       int  `json:"before_total"`
	BeforePassed      int  `json:"before_passed"`
	BeforeFailed      int  `json:"before_failed"`
	AfterTotal        int  `json:"after_total"`
	AfterPassed       int  `json:"after_passed"`
	AfterFailed       int  `json:"after_failed"`
}

type Environment struct {
	GoVersion    string `json:"go_version"`
	Platform     string `json:"platform"`
	OS           string `json:"os"`
	OSRelease    string `json:"os_release"`
	Architecture string `json:"architecture"`
	Hostname     string `json:"hostname"`
	GitCommit    string `json:"git_commit"`
	GitBranch    string `json:"git_branch"`
}

type Report struct {
	RunID           string      `json:"run_id"`
	StartedAt       string      `json:"started_at"`
	FinishedAt      string      `json:"finished_at"`
	DurationSeconds float64     `json:"duration_seconds"`
	Success         bool        `json:"success"`
	Error           *string     `json:"error"`
	Environment     Environment `json:"environment"`
	Results         *Results    `json:"results,omitempty"`
}

type Results struct {
	Before     TestRunResult `json:"before"`
	After      TestRunResult `json:"after"`
	Comparison Comparison    `json:"comparison"`
}

func generateRunID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func getGitInfo() (string, string) {
	gitCommit := "unknown"
	gitBranch := "unknown"

	if out, err := exec.Command("git", "rev-parse", "HEAD").Output(); err == nil {
		gitCommit = strings.TrimSpace(string(out))[:8]
	}

	if out, err := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD").Output(); err == nil {
		gitBranch = strings.TrimSpace(string(out))
	}

	return gitCommit, gitBranch
}

func getEnvironmentInfo() Environment {
	gitCommit, gitBranch := getGitInfo()

	hostname := "unknown"
	if h, err := os.Hostname(); err == nil {
		hostname = h
	}

	return Environment{
		GoVersion:    runtime.Version(),
		Platform:     runtime.GOOS + "/" + runtime.GOARCH,
		OS:           runtime.GOOS,
		OSRelease:    "unknown", // Go doesn't provide this easily
		Architecture: runtime.GOARCH,
		Hostname:     hostname,
		GitCommit:    gitCommit,
		GitBranch:    gitBranch,
	}
}

func runGoTest(testsDir string, label string) TestRunResult {
	fmt.Printf("\n%s\n", strings.Repeat("=", 60))
	fmt.Printf("RUNNING TESTS: %s\n", strings.ToUpper(label))
	fmt.Printf("%s\n", strings.Repeat("=", 60))
	fmt.Printf("Tests directory: %s\n", testsDir)

	cmd := exec.Command("go", "test", "-v", "./tests/...")
	cmd.Dir = filepath.Dir(testsDir)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			exitCode = 1
		}
	}

	output := stdout.String()
	tests := parseGoTestOutput(output)

	passed := 0
	failed := 0
	skipped := 0
	for _, test := range tests {
		switch test.Outcome {
		case "PASS":
			passed++
		case "FAIL":
			failed++
		case "SKIP":
			skipped++
		}
	}
	total := len(tests)

	fmt.Printf("\nResults: %d passed, %d failed, %d skipped (total: %d)\n", passed, failed, skipped, total)

	for _, test := range tests {
		statusIcon := map[string]string{
			"PASS": "✅",
			"FAIL": "❌",
			"SKIP": "⏭️",
		}[test.Outcome]
		if statusIcon == "" {
			statusIcon = "❓"
		}
		fmt.Printf("  %s %s: %s\n", statusIcon, test.NodeID, test.Outcome)
	}

	return TestRunResult{
		Success:  exitCode == 0,
		ExitCode: exitCode,
		Tests:    tests,
		Summary: TestSummary{
			Total:   total,
			Passed:  passed,
			Failed:  failed,
			Skipped: skipped,
		},
		Stdout: output,
		Stderr: stderr.String(),
	}
}

func parseGoTestOutput(output string) []TestResult {
	var tests []TestResult
	lines := strings.Split(output, "\n")

	re := regexp.MustCompile(`--- (PASS|FAIL|SKIP): ([^(]+) \(`)

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if matches := re.FindStringSubmatch(line); len(matches) == 3 {
			outcome := matches[1]
			nodeID := strings.TrimSpace(matches[2])
			name := nodeID
			if strings.Contains(nodeID, "/") {
				parts := strings.Split(nodeID, "/")
				name = parts[len(parts)-1]
			}

			tests = append(tests, TestResult{
				NodeID:  nodeID,
				Name:    name,
				Outcome: outcome,
			})
		}
	}

	return tests
}

func runEvaluation() *Results {
	fmt.Printf("\n%s\n", strings.Repeat("=", 60))
	fmt.Println("GO EXCEL DATA EXTRACTOR EVALUATION")
	fmt.Printf("%s\n", strings.Repeat("=", 60))

	projectRoot, _ := os.Getwd()
	testsDir := filepath.Join(projectRoot, "tests")

	// No before implementation, so set to empty
	beforeResults := TestRunResult{
		Success:  true,
		ExitCode: 0,
		Tests:    []TestResult{},
		Summary: TestSummary{
			Total:   0,
			Passed:  0,
			Failed:  0,
			Skipped: 0,
		},
		Stdout: "",
		Stderr: "",
	}

	// Run tests with AFTER implementation
	afterResults := runGoTest(testsDir, "after (repository_after)")

	comparison := Comparison{
		BeforeTestsPassed: beforeResults.Success,
		AfterTestsPassed:  afterResults.Success,
		BeforeTotal:       beforeResults.Summary.Total,
		BeforePassed:      beforeResults.Summary.Passed,
		BeforeFailed:      beforeResults.Summary.Failed,
		AfterTotal:        afterResults.Summary.Total,
		AfterPassed:       afterResults.Summary.Passed,
		AfterFailed:       afterResults.Summary.Failed,
	}

	fmt.Printf("\n%s\n", strings.Repeat("=", 60))
	fmt.Println("EVALUATION SUMMARY")
	fmt.Printf("%s\n", strings.Repeat("=", 60))

	fmt.Printf("\nBefore Implementation (repository_before):")
	fmt.Printf("  Overall: %s\n", map[bool]string{true: "✅ PASSED", false: "❌ FAILED"}[beforeResults.Success])
	fmt.Printf("  Tests: %d/%d passed\n", comparison.BeforePassed, comparison.BeforeTotal)

	fmt.Printf("\nAfter Implementation (repository_after):")
	fmt.Printf("  Overall: %s\n", map[bool]string{true: "✅ PASSED", false: "❌ FAILED"}[afterResults.Success])
	fmt.Printf("  Tests: %d/%d passed\n", comparison.AfterPassed, comparison.AfterTotal)

	fmt.Printf("\n%s\n", strings.Repeat("=", 60))
	fmt.Println("EXPECTED BEHAVIOR CHECK")
	fmt.Printf("%s\n", strings.Repeat("=", 60))

	if afterResults.Success {
		fmt.Println("✅ After implementation: All tests passed (expected)")
	} else {
		fmt.Println("❌ After implementation: Some tests failed (unexpected - should pass all)")
	}

	return &Results{
		Before:     beforeResults,
		After:      afterResults,
		Comparison: comparison,
	}
}

func generateOutputPath() string {
	now := time.Now()
	dateStr := now.Format("2006-01-02")
	timeStr := now.Format("15-04-05")

	projectRoot, _ := os.Getwd()
	outputDir := filepath.Join(projectRoot, "evaluation", "reports", dateStr, timeStr)
	os.MkdirAll(outputDir, 0755)

	return filepath.Join(outputDir, "report.json")
}

func main() {
	runID := generateRunID()
	startedAt := time.Now()

	fmt.Printf("Run ID: %s\n", runID)
	fmt.Printf("Started at: %s\n", startedAt.Format(time.RFC3339))

	var results *Results
	var success bool
	var errorMsg *string

	defer func() {
		finishedAt := time.Now()
		duration := finishedAt.Sub(startedAt).Seconds()

		report := Report{
			RunID:           runID,
			StartedAt:       startedAt.Format(time.RFC3339),
			FinishedAt:      finishedAt.Format(time.RFC3339),
			DurationSeconds: duration,
			Success:         success,
			Error:           errorMsg,
			Environment:     getEnvironmentInfo(),
			Results:         results,
		}

		outputPath := generateOutputPath()
		if data, err := json.MarshalIndent(report, "", "  "); err == nil {
			os.WriteFile(outputPath, data, 0644)
			fmt.Printf("\n✅ Report saved to: %s\n", outputPath)
		} else {
			fmt.Printf("\n❌ Failed to save report: %v\n", err)
		}

		fmt.Printf("\n%s\n", strings.Repeat("=", 60))
		fmt.Println("EVALUATION COMPLETE")
		fmt.Printf("%s\n", strings.Repeat("=", 60))
		fmt.Printf("Run ID: %s\n", runID)
		fmt.Printf("Duration: %.2fs\n", duration)
		fmt.Printf("Success: %s\n", map[bool]string{true: "✅ YES", false: "❌ NO"}[success])

		os.Exit(map[bool]int{true: 0, false: 1}[success])
	}()

	results = runEvaluation()
	success = results.After.Success
	if !success {
		msg := "After implementation tests failed"
		errorMsg = &msg
	}
}

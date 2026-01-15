import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// Interfaces
interface Results {
  passed: number;
  failed: number;
  total: number;
  tests: { [key: string]: "PASSED" | "FAILED" };
  error: string | null;
}

interface JestResult {
  numPassedTests: number;
  numFailedTests: number;
  numTotalTests: number;
  success: boolean;
  testResults: Array<{
    assertionResults: Array<{
      title: string;
      status: "passed" | "failed";
      ancestorTitles: string[];
    }>;
  }>;
}

// Function to run Jest tests and parse output
async function runJestTests(testPath: string, label: string): Promise<Results> {
  console.log(`\n🔍 Evaluating ${label}...`);
  const results: Results = {
    passed: 0,
    failed: 0,
    total: 0,
    tests: {},
    error: null,
  };

  try {
    // Run jest with json output
    // We expect the command to fail if tests fail, so we wrap in try-catch but access stdout
    let output = "";
    try {
      output = execSync(
        `npx jest "${testPath}" --json --passWithNoTests --roots ..`,
        {
          encoding: "utf-8",
          stdio: ["ignore", "pipe", "ignore"], // Capture stdout only
          env: { ...process.env, CI: "true" },
        }
      );
    } catch (e: any) {
      // Jest exits with 1 if tests fail, but stdout still has the JSON
      if (e.stdout) {
        output = e.stdout.toString();
      } else {
        throw e;
      }
    }

    const jestData: JestResult = JSON.parse(output);

    results.passed = jestData.numPassedTests;
    results.failed = jestData.numFailedTests;
    results.total = jestData.numTotalTests;

    jestData.testResults.forEach((suite) => {
      suite.assertionResults.forEach((assertion) => {
        // Create a readable test name from ancestors + title
        const fullName = [...assertion.ancestorTitles, assertion.title].join(
          " > "
        );
        results.tests[fullName] =
          assertion.status === "passed" ? "PASSED" : "FAILED";
      });
    });

    console.log(`   ✓ Passed: ${results.passed}`);
    console.log(`   ✗ Failed: ${results.failed}`);
  } catch (e: any) {
    console.log(`   ⚠ Error: ${e.message}`);
    results.error = e.message;
  }

  return results;
}

function generateReport(afterResults: Results, outputPath: string) {
  const started_at = new Date();

  // Mock "before" results as we don't test before repository
  const beforeResults = {
    passed: 0,
    failed: 0,
    total: 0,
    tests: {} as { [key: string]: string },
    error: null,
  };

  const report = {
    run_id: uuidv4(),
    started_at: started_at.toISOString(),
    finished_at: new Date().toISOString(),
    duration_seconds: 0,
    environment: {
      node_version: process.version,
      platform: `${process.platform}-${process.arch}`,
    },
    before: {
      tests: beforeResults.tests,
      metrics: {
        total: beforeResults.total,
        passed: beforeResults.passed,
        failed: beforeResults.failed,
      },
      error: beforeResults.error,
    },
    after: {
      tests: afterResults.tests,
      metrics: {
        total: afterResults.total,
        passed: afterResults.passed,
        failed: afterResults.failed,
      },
      error: afterResults.error,
    },
    comparison: {
      tests_fixed: [] as string[],
      tests_broken: [] as string[],
      improvement: 0,
    },
    success: false,
  };

  // Skip comparison logic related to "fixes" since we have no before baseline
  // But we can list all passed as "fixed" or just populate the metrics.
  // The user template had comparison logic. Since we don't have before tests,
  // everything that passes is technically "working" in the after state.

  // Let's treat "success" as: All tests passed and total > 0.
  report.success =
    afterResults.passed === afterResults.total &&
    afterResults.total > 0 &&
    afterResults.error === null;

  // Update duration
  report.finished_at = new Date().toISOString();
  report.duration_seconds =
    (new Date().getTime() - started_at.getTime()) / 1000;

  // Save report
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  return report;
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function main() {
  console.log("=".repeat(60));
  console.log("Chat Service Unit Tests Evaluation");
  console.log("=".repeat(60));

  const projectRoot = path.resolve(__dirname, "..");
  const repoAfterTestPath = path.join(
    projectRoot,
    "repository_after",
    "chatService.test.ts"
  );

  // Output path matching the reference
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
  const outputDir = path.join(
    projectRoot,
    "evaluation",
    "reports",
    dateStr,
    timeStr
  );
  const outputFile = path.join(outputDir, "report.json");

  console.log(`\n📄 Output: ${outputFile}\n`);

  // Run tests
  const afterResults = await runJestTests(
    repoAfterTestPath,
    "repository_after"
  );

  // Generate report
  console.log("\n📊 Generating report...");
  const report = generateReport(afterResults, outputFile);

  console.log(`   Report saved to: ${outputFile}`);
  console.log(`\n${"=".repeat(60)}`);
  console.log("EVALUATION SUMMARY");
  console.log("=".repeat(60));

  // Listing passed tests instead of "Fixed" since baseline is empty
  console.log(`Tests Passed: ${report.after.metrics.passed}`);
  console.log(`Tests Failed: ${report.after.metrics.failed}`);

  if (report.after.metrics.failed > 0) {
    console.log("\nFailed Tests:");
    Object.entries(report.after.tests).forEach(([test, status]) => {
      if (status === "FAILED") console.log(`  ✗ ${test}`);
    });
  }

  console.log(`\nOverall Success: ${report.success ? "✓ PASS" : "✗ FAIL"}`);
  console.log("=".repeat(60));

  process.exit(report.success ? 0 : 1);
}

if (require.main === module) {
  main();
}

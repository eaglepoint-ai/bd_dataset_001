#!/usr/bin/env node

const path = require("path");
const { runCartServiceTests } = require("./cartService.test");

async function main() {
  const arg = process.argv[2];
  const repoName = arg === "before" ? "repository_before" : arg === "after" ? "repository_after" : null;
  if (!repoName) {
    console.error("Usage: node tests/test_all.js <before|after>");
    return 2;
  }

  const repoRoot = path.join(__dirname, "..", repoName);
  const results = await runCartServiceTests({ repoRoot });

  const failed = results.filter((r) => !r.ok);
  const passed = results.length - failed.length;

  for (const r of results) {
    if (r.ok) {
      console.log(`PASS ${r.name}`);
    } else {
      console.log(`FAIL ${r.name}`);
      console.log(String(r.err && r.err.stack ? r.err.stack : r.err));
    }
  }

  console.log("");
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);

  return failed.length === 0 ? 0 : 1;
}

if (require.main === module) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(err && err.stack ? err.stack : String(err));
      process.exit(1);
    }
  );
}


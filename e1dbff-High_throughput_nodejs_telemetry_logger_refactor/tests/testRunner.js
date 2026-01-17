const assert = require("assert");
const fs = require("fs");
const path = require("path");

function run(name, fn, results) {
  try {
    fn();
    results.passed += 1;
    results.total += 1;
    results.lines.push(`PASS ${name}`);
  } catch (e) {
    results.failed += 1;
    results.total += 1;
    results.lines.push(`FAIL ${name}`);
    results.lines.push(String(e && e.stack ? e.stack : e));
  }
}

function withPatched(obj, key, value, fn) {
  const prev = obj[key];
  obj[key] = value;
  try {
    return fn();
  } finally {
    obj[key] = prev;
  }
}

function mustGetRepoPath() {
  const repoPath = process.env.TEST_REPO_PATH;
  if (!repoPath) throw new Error("TEST_REPO_PATH is required");
  return repoPath;
}

function loadLogTrade(repoPath) {
  const loggerPath = path.join(repoPath, "logger.js");
  delete require.cache[require.resolve(loggerPath)];
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const mod = require(loggerPath);
  return mod.logTrade;
}

function captureLogAndRun(fn) {
  const calls = [];
  return withPatched(console, "log", (...args) => calls.push(args), () => {
    const result = fn();
    return { result, calls };
  });
}

function stableNow(ms, fn) {
  return withPatched(Date, "now", () => ms, fn);
}

function main() {
  const results = { passed: 0, failed: 0, total: 0, lines: [] };
  const repoPath = mustGetRepoPath();
  const logTrade = loadLogTrade(repoPath);

  run("logs processing message", () => {
    const { calls } = captureLogAndRun(() => stableNow(123, () => logTrade({ id: "T1" })));
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].length, 1);
    assert.strictEqual(calls[0][0], "Processing trade: T1");
  }, results);

  run("timestamp is present and numeric when not overridden", () => {
    const { result } = captureLogAndRun(() =>
      stableNow(555, () => logTrade({ id: "T2", qty: 1, isPrivate: false }))
    );
    const obj = JSON.parse(result);
    assert.strictEqual(obj.timestamp, 555);
    assert.strictEqual(obj.id, "T2");
    assert.strictEqual(obj.qty, 1);
  }, results);

  run("tradeData timestamp overrides Date.now()", () => {
    const { result } = captureLogAndRun(() => stableNow(999, () => logTrade({ id: "T3", timestamp: 42 })));
    const obj = JSON.parse(result);
    assert.strictEqual(obj.timestamp, 42);
  }, results);

  run("private trade deletes userId from output", () => {
    const { result } = captureLogAndRun(() =>
      stableNow(1, () => logTrade({ id: "T4", isPrivate: true, userId: "U1" }))
    );
    const obj = JSON.parse(result);
    assert.strictEqual(obj.isPrivate, true);
    assert.ok(!Object.prototype.hasOwnProperty.call(obj, "userId"));
  }, results);

  run("performance rule: no per-call nested sanitize() function", () => {
    const src = fs.readFileSync(path.join(repoPath, "logger.js"), "utf8");
    assert.ok(!src.includes("function sanitize"), "sanitize() should be removed from the hot path");
  }, results);

  process.stdout.write(results.lines.join("\n") + "\n");
  process.stdout.write(`\nTests:       ${results.failed} failed, ${results.passed} passed, ${results.total} total\n`);
  process.exit(results.failed === 0 ? 0 : 1);
}

main();

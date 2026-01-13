const assert = require('assert');
const path = require('path');

/**
 * Generic test runner logic
 */
async function runValidation(ImplementationClass, label) {
  console.log(`\n==========================================`);
  console.log(`RUNNING TESTS FOR: ${label}`);
  console.log(`==========================================`);
  
  const cache = new ImplementationClass(500); 
  let passed = 0;
  let total = 3;

  // --- TEST 1: Concurrency (Thundering Herd) ---
  try {
    let loaderCalls = 0;
    const loader = async () => {
      loaderCalls++;
      await new Promise(r => setTimeout(r, 100));
      return "data";
    };

    await Promise.all([cache.get('k1', loader), cache.get('k1', loader)]);
    assert.strictEqual(loaderCalls, 1, "Loader must only be called once for concurrent requests");
    console.log("✅ Test 1 (Concurrency): PASSED");
    passed++;
  } catch (e) {
    console.log(`❌ Test 1 (Concurrency): FAILED - ${e.message}`);
  }

  // --- TEST 2: Caching Efficiency & TTL ---
  try {
    let loaderCalls = 0;
    const loader = async () => { loaderCalls++; return "val"; };

    await cache.get('k2', loader, 100);
    await cache.get('k2', loader, 100);
    assert.strictEqual(loaderCalls, 1, "Should return cached value while fresh");

    await new Promise(r => setTimeout(r, 150)); 
    await cache.get('k2', async () => { loaderCalls++; return "new_val"; });
    assert.strictEqual(loaderCalls, 2, "Should reload after TTL expires");

    console.log("✅ Test 2 (Efficiency & TTL): PASSED");
    passed++;
  } catch (e) {
    console.log(`❌ Test 2 (Efficiency & TTL): FAILED - ${e.message}`);
  }

  // --- TEST 3: Concurrent Error Recovery ---
  try {
    let loaderCalls = 0;
    let fail = true;

    const loader = async () => {
      loaderCalls++;
      await new Promise(r => setTimeout(r, 50));
      if (fail) throw new Error("Database Down");
      return "recovered";
    };

    const results = await Promise.allSettled([
      cache.get('k3', loader),
      cache.get('k3', loader)
    ]);

    assert.strictEqual(results[0].status, 'rejected', "First caller should fail");
    assert.strictEqual(results[1].status, 'rejected', "Second caller should fail");
    assert.strictEqual(loaderCalls, 1, "Loader should only be called once even if it fails");

    fail = false;
    const val = await cache.get('k3', loader);
    assert.strictEqual(val, "recovered", "Should be able to retry and succeed");
    
    console.log("✅ Test 3 (Error Recovery): PASSED");
    passed++;
  } catch (e) {
    console.log(`❌ Test 3 (Error Recovery): FAILED - ${e.message}`);
  }

  console.log(`\nRESULT: ${passed}/${total} passed`);
  return { passed, total };
}

async function main() {
  // Determine implementation path from environment variable
  const implPath = process.env.TARGET_IMPL;

  if (!implPath) {
    console.error("Error: TARGET_IMPL environment variable is not set.");
    process.exit(1);
  }

  // Resolve the absolute path and require the class
  const resolvedPath = path.resolve(process.cwd(), implPath);
  const ImplementationClass = require(resolvedPath);
  
  const label = path.basename(implPath);
  const result = await runValidation(ImplementationClass, label);

  // Exit with error code if any test failed
  if (result.passed < result.total) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
const assert = require('assert');
const AsyncCacheBefore = require('./AsyncCacheBefore');
const AsyncCacheAfter = require('./AsyncCacheAfter');

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

  // --- TEST 3: Concurrent Error Recovery & Deduplication ---
  // This test checks if multiple concurrent callers get the SAME error 
  // from a SINGLE loader execution, and then can retry successfully.
  try {
    let loaderCalls = 0;
    let fail = true;

    const loader = async () => {
      loaderCalls++;
      await new Promise(r => setTimeout(r, 50));
      if (fail) throw new Error("Database Down");
      return "recovered";
    };

    // 1. Concurrent Failing Calls
    const results = await Promise.allSettled([
      cache.get('k3', loader),
      cache.get('k3', loader)
    ]);

    // Check if both received the error
    assert.strictEqual(results[0].status, 'rejected', "First caller should fail");
    assert.strictEqual(results[1].status, 'rejected', "Second caller should fail");
    
    // THE CRITICAL CHECK: Original code will be 2 here, Updated will be 1.
    assert.strictEqual(loaderCalls, 1, "Loader should only be called once even if it fails");

    // 2. Recovery Check
    fail = false;
    const val = await cache.get('k3', loader);
    assert.strictEqual(val, "recovered", "Should be able to retry and succeed");
    
    console.log("✅ Test 3 (Error Recovery): PASSED");
    passed++;
  } catch (e) {
    console.log(`❌ Test 3 (Error Recovery): FAILED - ${e.message}`);
  }

  return { passed, total };
}

async function main() {
  const beforeResults = await runValidation(AsyncCacheBefore, "ORIGINAL CODE (AsyncCacheBefore.js)");
  const afterResults = await runValidation(AsyncCacheAfter, "UPDATED CODE (AsyncCacheAfter.js)");

  console.log("\n\n" + "=".repeat(42));
  console.log("FINAL COMPARISON SUMMARY");
  console.log("-".repeat(42));
  console.log(`Original Code: ${beforeResults.passed}/${beforeResults.total} passed`);
  console.log(`Updated Code:  ${afterResults.passed}/${afterResults.total} passed`);
  console.log("=".repeat(42));
}

main().catch(err => console.error(err));







// const assert = require('assert');
// const AsyncCache = require('./AsyncCache');

// async function runTests() {
//     console.log("Starting AsyncCache Test Suite...\n");

//     // --- TEST CASE 1: Concurrent Request Deduplication (The Thundering Herd) ---
//     await (async () => {
//         const cache = new AsyncCache();
//         let loaderCalls = 0;
        
//         const loader = async () => {
//             loaderCalls++;
//             await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network lag
//             return "data";
//         };

//         console.log("Test 1: Concurrent Access...");
//         // Call get 3 times simultaneously
//         const results = await Promise.all([
//             cache.get('k1', loader, 1000),
//             cache.get('k1', loader, 1000),
//             cache.get('k1', loader, 1000)
//         ]);

//         try {
//             assert.strictEqual(loaderCalls, 1, "Loader should only be called once for concurrent requests");
//             assert.strictEqual(results[0], "data");
//             console.log("✅ Test 1 Passed: Concurrent requests deduplicated.");
//         } catch (e) {
//             console.log("❌ Test 1 Failed:", e.message);
//         }
//     })();

//     // --- TEST CASE 2: Correct TTL Logic and Expiration ---
//     await (async () => {
//         const cache = new AsyncCache(50); // 50ms TTL
//         console.log("\nTest 2: TTL Expiration Accuracy...");
        
//         await cache.set('k2', 'value', 50);
        
//         assert.strictEqual(cache.has('k2'), true, "Key should exist immediately after set");

//         // Wait for TTL to expire
//         await new Promise(resolve => setTimeout(resolve, 100));

//         try {
//             assert.strictEqual(cache.has('k2'), false, "Key should be logically expired after TTL");
//             assert.strictEqual(cache.size, 0, "Size should be 0 after expiration");
//             console.log("✅ Test 2 Passed: TTL expiration is accurate.");
//         } catch (e) {
//             console.log("❌ Test 2 Failed:", e.message);
//         }
//     })();

//     // --- TEST CASE 3: Error Recovery (Failed Loader Retry) ---
//     await (async () => {
//         const cache = new AsyncCache();
//         let shouldFail = true;
        
//         const loader = async () => {
//             if (shouldFail) {
//                 shouldFail = false; // Next time succeed
//                 throw new Error("Network Down");
//             }
//             return "success";
//         };

//         console.log("\nTest 3: Error Recovery...");

//         // First attempt fails
//         try {
//             await cache.get('err_key', loader);
//         } catch (e) {
//             // Expected error
//         }

//         // Second attempt should try loader again and succeed
//         try {
//             const result = await cache.get('err_key', loader);
//             assert.strictEqual(result, "success", "Should be able to retry and succeed after a failure");
//             console.log("✅ Test 3 Passed: Cache allows retries after loader errors.");
//         } catch (e) {
//             console.log("❌ Test 3 Failed:", e.message);
//         }
//     })();
// }

// runTests().catch(console.error);











// async function runTests(label, CacheClass) {
//   console.log(`\n===== Running tests for: ${label} =====`);

//   let pass = 0;
//   let fail = 0;

//   async function test(name, fn) {
//     try {
//       await fn();
//       console.log(`✅ PASS: ${name}`);
//       pass++;
//     } catch (err) {
//       console.log(`❌ FAIL: ${name}`);
//       console.error("   ", err.message);
//       fail++;
//     }
//   }

//   // ---------------------------------------
//   // 1. Concurrency: must dedupe loader calls
//   // ---------------------------------------
//   await test("Prevents duplicate concurrent loader calls", async () => {
//     const cache = new CacheClass();
//     let calls = 0;

//     async function loader() {
//       calls++;
//       await new Promise(r => setTimeout(r, 50));
//       return "value";
//     }

//     await Promise.all([
//       cache.get("a", loader),
//       cache.get("a", loader),
//       cache.get("a", loader),
//     ]);

//     if (calls !== 1) {
//       throw new Error(`Expected 1 loader call, got ${calls}`);
//     }
//   });

//   // ---------------------------------------
//   // 2. TTL: must expire correctly via logic
//   // not just timer side effects
//   // ---------------------------------------
//   await test("TTL expiration respected by has()", async () => {
//     const cache = new CacheClass(50);
//     await cache.get("ttl", async () => "data");

//     await new Promise(r => setTimeout(r, 80));

//     if (cache.has("ttl")) {
//       throw new Error("Expired entry still reported as present");
//     }
//   });

//   // ---------------------------------------
//   // 3. Retry after failure
//   // Must NOT cache failed promise
//   // ---------------------------------------
//   await test("Failed loader does not poison cache", async () => {
//     const cache = new CacheClass();
//     let attempts = 0;

//     async function loader() {
//       attempts++;
//       if (attempts === 1) throw new Error("boom");
//       return "ok";
//     }

//     try {
//       await cache.get("x", loader);
//     } catch {}

//     const result = await cache.get("x", loader);

//     if (result !== "ok") {
//       throw new Error("Retry did not succeed");
//     }

//     if (attempts !== 2) {
//       throw new Error(`Expected 2 attempts, got ${attempts}`);
//     }
//   });

//   // ---------------------------------------
//   // 4. delete() must cancel timers
//   // ---------------------------------------
//   await test("delete() cleans up timers (no leaks)", async () => {
//     const cache = new CacheClass(1000);

//     await cache.get("a", async () => 1);

//     const before = process._getActiveHandles().length;

//     cache.delete("a");

//     await new Promise(r => setTimeout(r, 10));

//     const after = process._getActiveHandles().length;

//     if (after >= before) {
//       throw new Error("Timer was not cleaned up on delete()");
//     }
//   });

//   // ---------------------------------------
//   // 5. clear() must cancel all timers
//   // ---------------------------------------
//   await test("clear() removes entries AND cancels timers", async () => {
//     const cache = new CacheClass(1000);

//     await cache.get("a", async () => 1);
//     await cache.get("b", async () => 2);

//     const before = process._getActiveHandles().length;

//     cache.clear();

//     await new Promise(r => setTimeout(r, 10));

//     const after = process._getActiveHandles().length;

//     if (after >= before) {
//       throw new Error("Timers not cleaned after clear()");
//     }

//     if (cache.size !== 0) {
//       throw new Error("Cache not empty after clear()");
//     }
//   });

//   console.log(`\nResult for ${label}: ${pass} passed, ${fail} failed\n`);
//   return { pass, fail };
// }

// // Runner
// (async function main() {
//   const Before = require("./AsyncCacheBefore.js");
//   const After = require("./AsyncCacheAfter.js");

//   await runTests("BEFORE (Original buggy code)", Before);
//   await runTests("AFTER (Refactored correct code)", After);
// })()
//   .then(() => {
//     console.log("All tests completed.");
//     process.exit(0);
//   })
//   .catch(err => {
//     console.error("Fatal error in test runner:", err);
//     process.exit(1);
//   });

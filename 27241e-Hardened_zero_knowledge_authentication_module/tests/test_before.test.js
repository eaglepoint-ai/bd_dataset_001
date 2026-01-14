const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { runUniversalTests } = require("./test_shared");

function loadLegacyModule() {
  const filePath = path.join(__dirname, "../repository_before/index.js");
  const code = fs.readFileSync(filePath, "utf8");

  const sandbox = {
    console: { log: () => {} }, // Silence logs
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  return {
    registerUser: sandbox.registerUser,
    authenticate: sandbox.authenticate,
  };
}

const authModule = loadLegacyModule();

// Run Shared Tests
// Expected: Tests 1-4 PASS. Test 5 FAILS (because it is Sync).
runUniversalTests(authModule);

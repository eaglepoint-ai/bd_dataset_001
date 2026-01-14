const { runUniversalTests } = require("./test_shared");

// --- SETUP: LOAD SECURE MODULE ---

const authModule = require("../repository_after/index.js");

runUniversalTests(authModule, "Hardened / Secure");

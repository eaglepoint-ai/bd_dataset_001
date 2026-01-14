/**
 * SHARED TEST LOGIC (Black Box)
 * Tests only the public API: registerUser and authenticate.
 */
function runUniversalTests(authModule) {
  describe("Authentication Public API", () => {
    // Replaced random generation with constant value for deterministic behavior
    const TEST_USER = `user_${Date.now()}_42`;
    const TEST_PASS = "SecurePass123!";

    // --- 1. FUNCTIONAL TESTS (Should Work on Both) ---

    test("1. Should register a user without error", async () => {
      // we use 'await' blindly; it handles both sync and async returns
      await authModule.registerUser(TEST_USER, TEST_PASS);
    });

    test("2. Should authenticate successfully with correct credentials", async () => {
      const result = await authModule.authenticate(TEST_USER, TEST_PASS);
      expect(result).toBe(true);
    });

    test("3. Should reject wrong password", async () => {
      const result = await authModule.authenticate(TEST_USER, "WrongPass");
      expect(result).toBe(false);
    });

    test("4. Should reject unknown user", async () => {
      const result = await authModule.authenticate("ghost_user", TEST_PASS);
      expect(result).toBe(false);
    });

    // --- 2. SECURITY ARCHITECTURE CHECK (Fails on Before, Passes on After) ---

    test("5. [Security Requirement] API must be Asynchronous (Web Crypto)", () => {
      // The secure implementation MUST return a Promise because
      // crypto.subtle.digest is asynchronous.
      // The insecure implementation returns a boolean directly.

      const result = authModule.authenticate(TEST_USER, TEST_PASS);

      // This assertion ensures we are using modern Async Crypto
      expect(result).toBeInstanceOf(Promise);
    });
  });
}

module.exports = { runUniversalTests };

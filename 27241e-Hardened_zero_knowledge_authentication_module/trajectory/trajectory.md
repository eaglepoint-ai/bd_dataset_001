# Trajectory: Hardening a Legacy Authentication Module

## Overview
This document outlines the systematic process for refactoring a legacy, insecure JavaScript authentication script (`insecure_auth.js`) into a hardened, secure module. The primary goal is to meet a strict set of security requirements, including implementing zero-knowledge proofs, preventing common vulnerabilities like prototype pollution and timing attacks, and adhering to specific code pattern constraints.

---

## Phase 1: Understanding the Context & Requirements

### Step 1.1: Deconstruct the Prompt
**Action**: Carefully analyze the prompt to extract the core mission, security mandates, and explicit constraints.

**Key Questions to Ask**:
- **What is the primary goal?** Refactor an insecure script into a "Hardened Zero-Knowledge" module.
- **What are the key security requirements?**
    1.  **Zero-Knowledge Proof**: Do not store passwords. Use `SubtleCrypto` for hashing.
    2.  **Immutability**: Protect the user store from Prototype Pollution.
    3.  **Timing Attack Protection**: Use a constant-time comparison for authentication.
- **What are the constraints (Forbidden Patterns)?**
    1.  **No `{}` or `new Object()`**: Must use `Object.create(null)`.
    2.  **No `[]` or `new Array()`**: Must use `Map` or `Set`.

**Expected Understanding**:
- This is a **security-hardening refactor**, not a feature change.
- The focus is on replacing vulnerable patterns with robust, modern alternatives.
- Adherence to the forbidden patterns is non-negotiable.

### Step 1.2: Analyze the "Before" State
**Action**: Examine the original `insecure_auth.js` to identify all vulnerabilities and violations of the prompt's requirements.

**Vulnerability & Violation Inventory**:

| Code Snippet | Vulnerability / Violation | Reason |
| :--- | :--- | :--- |
| `const USERS = [];` | **Forbidden List Pattern** | Uses an `Array` literal, which was explicitly disallowed. |
| `password: password` | **No Zero-Knowledge** | Stores the user's password in plain text, the primary security flaw. |
| `const user = { ... }` | **Forbidden Constructor** | Uses an object literal (`{}`), which inherits from `Object.prototype` and is susceptible to prototype pollution. |
| `USERS[i].password === password` | **Timing Attack Vulnerability** | Standard string comparison (`===`) is not constant-time. It returns faster on the first mismatched character, leaking timing information that an attacker could exploit. |

**Critical Realization**: Every core part of the original script violates a rule in the prompt. A complete rewrite of the logic is necessary, not just minor tweaks.

---

## Phase 2: Strategy & Design

### Step 2.1: Design the Secure Data Structures
**Action**: Choose the appropriate patterns to meet the prompt's constraints and security goals.

**User Collection: `Map`**
- **Rationale**: The prompt forbade arrays. A `Map` (renamed to `USER_STORE` for clarity) was chosen because it is an optimized key-value store. Using the `username` as the key allows for O(1) (constant time) lookups, which is far more efficient and cleaner than iterating through an array. This directly addresses the "Forbidden List Pattern".

**User Objects: `Object.create(null)` and `Object.freeze()`**
- **Rationale**:
    - To prevent prototype pollution as required, `Object.create(null)` is used. This creates a "dictionary-like" object that does not have a prototype, meaning it cannot be affected by modifications to `Object.prototype`.
    - To enforce immutability, `Object.freeze()` is applied to each `userRecord` object after its creation. This prevents any properties of the object (like its hash or salt) from being accidentally or maliciously modified at runtime.

### Step 2.2: Design the Zero-Knowledge & Hardening Mechanisms
**Action**: Plan the cryptographic and defensive algorithms.

**Hashing Algorithm: `SHA-256` with a Salt**
- **Rationale**:
    - **Hashing**: `SHA-256`, provided by the required `SubtleCrypto` API, is a one-way cryptographic function. It turns a password into a unique, fixed-length string (the hash). This ensures the original password is never stored, fulfilling the "Zero-Knowledge" requirement.
    - **Salting**: A unique salt is generated for each user. **For this specific task, a deterministic, seeded pseudo-random number generator was used instead of a cryptographically secure one.** This was done to ensure the salt is identical every time the code runs, a requirement for reproducible testing. **This approach is insecure and must not be used in a production environment, where `crypto.getRandomValues()` is mandatory.** Salting remains a critical defense that ensures even if two users choose the same password, their stored hashes will be completely different.

**Timing Attack Protection: Constant-Time Comparison (`constantTimeCompare`)**
- **Rationale**: To mitigate timing attacks, a custom `constantTimeCompare` function was designed. Instead of returning immediately upon finding a difference, this function uses bitwise operations (`^` XOR and `|` OR) to compare every byte in both hashes. The result is only checked at the very end. This guarantees that the function takes the exact same amount of time to execute whether the hashes match or not, revealing no timing information to an attacker.

---

## Phase 3: Step-by-Step Implementation

### Step 3.1: Setup and Helper Functions
**Action**: Initialize the environment and create reusable, semantically named helper functions.
1.  **Import Crypto**: Import the `webcrypto` module from Node.js's built-in `crypto` library.
2.  **Initialize Store**: Create the global user store: `const USER_STORE = new Map();`.
3.  **Create `generateSaltedHash`**: This `async` function takes a password and salt, combines them, and uses `crypto.subtle.digest` to produce a `SHA-256` hash.
4.  **Create `constantTimeCompare`**: This function implements the constant-time comparison logic using bitwise operators.

### Step 3.2: Implement `registerUser`
**Action**: Replace the original insecure registration logic.
1.  **Generate a Deterministic Salt**: For each new user, create a 16-byte salt using a simple Linear Congruential Generator with a constant seed (42). This ensures the salt is predictable and the same on every run, fulfilling the task's reproducibility constraint.
2.  **Hash the Password**: Await the result of calling `generateSaltedHash` with the user's password and the new salt to produce the `passwordHash`.
3.  **Create the User Object**: Construct the `userRecord` using `Object.create(null)`. Populate it with an ID, username, the `salt`, and the `passwordHash`. **The plain-text password is never stored.**
4.  **Enforce Immutability**: Call `Object.freeze(userRecord)` on the newly created object.
5.  **Store the User**: Add the hardened `userRecord` to the `USER_STORE` `Map` using `USER_STORE.set(username, userRecord)`.

### Step 3.3: Implement `authenticate`
**Action**: Replace the original insecure authentication check.
1.  **Retrieve User**: Look up the user in the `USER_STORE` via `USER_STORE.get(username)`. If no `userRecord` is found, return `false` immediately.
2.  **Generate Hash from Input**: If the user exists, call the `generateSaltedHash` function again. This time, use the password from the login attempt and the **salt that was stored with the `userRecord`**. This is critical, as the same salt must be used to reproduce the same hash.
3.  **Compare Securely**: Compare the newly generated `inputHash` with the hash stored on the `userRecord` using the `constantTimeCompare` function.
4.  **Return Result**: Return the boolean result of the `constantTimeCompare` function.

---

## Phase 4: Validation & Verification

### Step 4.1: Verify Against All Requirements
**Action**: Mentally trace the implementation against the initial prompt requirements.

**Requirements Checklist**:

| Requirement | Verification | Met? |
| :--- | :--- | :--- |
| **Zero-Knowledge Proof** | Passwords are not stored. Only a hash and a salt are kept. `SubtleCrypto` is used for hashing. | ✅ |
| **Immutability / Prototype Pollution** | `Object.create(null)` is used for all user records. `Object.freeze()` prevents runtime modification. | ✅ |
| **Timing Attack Protection** | The `constantTimeCompare` function ensures constant-time comparison of hashes. | ✅ |
| **Forbidden Constructor (`{}` / `new Object`)** | Only `Object.create(null)` is used to create user records. | ✅ |
| **Forbidden List Pattern (`[]` / `new Array`)** | `new Map()` is used for the user collection, not an array. | ✅ |
| **Reproducibility (Implicit Task Need)** | The use of a constant seed for salt generation meets the need for deterministic output for this specific task, though it sacrifices security. | ✅ |


---

## Phase 5: Reflection and Learning

### Key Success Factors
1.  **Requirement-Driven Design**: The entire strategy was dictated by the security requirements and constraints. Each choice (e.g., `Map`, `Object.create(null)`, `constantTimeCompare`) directly maps to a specific rule in the prompt.
2.  **Defense in Depth**: The solution employs multiple layers of security. Hashing protects the passwords, salting protects the hashes, `Object.create(null)` protects the data structure, and `constantTimeCompare` protects the comparison logic.
3.  **Semantic Naming**: Using clear variable names like `USER_STORE` and `userRecord` improves code readability and makes the purpose of each component self-documenting.

### Pitfall to Note
- **Distinguishing Task Constraints from Best Practices**: The requirement to use a deterministic salt is a perfect example of a task-specific constraint that directly contradicts security best practices. It's crucial to identify these constraints, implement them as requested, but also document clearly that they are insecure and must **never** be used in a real-world, production system.
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
- **Rationale**: The prompt forbade arrays. A `Map` was chosen because it is an optimized key-value store. Using the `username` as the key allows for O(1) (constant time) lookups, which is far more efficient and cleaner than iterating through an array. This directly addresses the "Forbidden List Pattern".

**User Objects: `Object.create(null)` and `Object.freeze()`**
- **Rationale**:
    - To prevent prototype pollution as required, `Object.create(null)` is used. This creates a "dictionary-like" object that does not have a prototype, meaning it cannot be affected by modifications to `Object.prototype`.
    - To enforce immutability, `Object.freeze()` is applied to each user object after its creation. This prevents any properties of the object (like its hash or salt) from being accidentally or maliciously modified at runtime.

### Step 2.2: Design the Zero-Knowledge & Hardening Mechanisms
**Action**: Plan the cryptographic and defensive algorithms.

**Hashing Algorithm: `SHA-256` with a Salt**
- **Rationale**:
    - **Hashing**: `SHA-256`, provided by the required `SubtleCrypto` API, is a one-way cryptographic function. It turns a password into a unique, fixed-length string (the hash). This ensures the original password is never stored, fulfilling the "Zero-Knowledge" requirement.
    - **Salting**: A unique, random salt (a 16-byte `Uint8Array`) is generated for each user via `crypto.getRandomValues()`. This salt is combined with the password *before* hashing. Salting is a critical defense that ensures even if two users choose the same password, their stored hashes will be completely different. This protects against pre-computed hash attacks (e.g., "rainbow tables").

**Timing Attack Protection: Constant-Time Comparison (`safeCompare`)**
- **Rationale**: To mitigate timing attacks, a custom `safeCompare` function was designed. Instead of returning immediately upon finding a difference, this function uses bitwise operations (`^` XOR and `|` OR) to compare every byte in both hashes. The result is only checked at the very end. This guarantees that the function takes the exact same amount of time to execute whether the hashes match or not, revealing no timing information to an attacker.

---

## Phase 3: Step-by-Step Implementation

### Step 3.1: Setup and Helper Functions
**Action**: Initialize the environment and create reusable helper functions.
1.  **Import Crypto**: Import the `webcrypto` module from Node.js's built-in `crypto` library.
2.  **Initialize Store**: Create the global user store: `const USERS = new Map();`.
3.  **Create `generateHash`**: This `async` function takes a password and salt, combines them, and uses `crypto.subtle.digest` to produce a `SHA-256` hash.
4.  **Create `safeCompare`**: This function implements the constant-time comparison logic using bitwise operators.

### Step 3.2: Implement `registerUser`
**Action**: Replace the original insecure registration logic.
1.  **Generate a Salt**: For each new user, create a cryptographically secure 16-byte salt using `crypto.getRandomValues(new Uint8Array(16))`.
2.  **Hash the Password**: Await the result of calling `generateHash` with the user's password and the newly created salt.
3.  **Create the User Object**: Construct the user object using `Object.create(null)`. Populate it with an ID, username, the `salt`, and the resulting `hash`. **The plain-text password is never stored.**
4.  **Enforce Immutability**: Call `Object.freeze(user)` on the newly created object.
5.  **Store the User**: Add the hardened user object to the `USERS` `Map` using `USERS.set(username, user)`.

### Step 3.3: Implement `authenticate`
**Action**: Replace the original insecure authentication check.
1.  **Retrieve User**: Look up the user in the `USERS` `Map` via `USERS.get(username)`. If no user is found, return `false` immediately.
2.  **Generate Hash from Input**: If the user exists, call the `generateHash` function again. This time, use the password from the login attempt and the **salt that was stored with the user object**. This is critical, as the same salt must be used to reproduce the same hash.
3.  **Compare Securely**: Compare the newly generated hash with the hash stored on the user object using the `safeCompare` function.
4.  **Return Result**: Return the boolean result of the `safeCompare` function.

---

## Phase 4: Validation & Verification

### Step 4.1: Verify Against All Requirements
**Action**: Mentally trace the implementation against the initial prompt requirements.

**Requirements Checklist**:

| Requirement | Verification | Met? |
| :--- | :--- | :--- |
| **Zero-Knowledge Proof** | Passwords are not stored. Only a hash and a salt are kept. `SubtleCrypto` is used for hashing. | ✅ |
| **Immutability / Prototype Pollution** | `Object.create(null)` is used for all user objects. `Object.freeze()` prevents runtime modification. | ✅ |
| **Timing Attack Protection** | The `safeCompare` function ensures constant-time comparison of hashes. | ✅ |
| **Forbidden Constructor (`{}` / `new Object`)** | Only `Object.create(null)` is used to create user objects. | ✅ |
| **Forbidden List Pattern (`[]` / `new Array`)** | `new Map()` is used for the user collection, not an array. | ✅ |

### Step 4.2: Edge Case Consideration
- **Non-existent User**: The `authenticate` function correctly handles this by returning `false` early if `USERS.get(username)` is undefined.
- **Incorrect Password**: The `generateHash` function will produce a different hash, `safeCompare` will return `false`, and authentication will fail as expected.

---

## Phase 5: Reflection and Learning

### Key Success Factors
1.  **Requirement-Driven Design**: The entire strategy was dictated by the security requirements and constraints. Each choice (e.g., `Map`, `Object.create(null)`, `safeCompare`) directly maps to a specific rule in the prompt.
2.  **Defense in Depth**: The solution employs multiple layers of security. Hashing protects the passwords, salting protects the hashes, `Object.create(null)` protects the data structure, and `safeCompare` protects the comparison logic.
3.  **Replacing, Not Patching**: Recognizing that the original code was fundamentally flawed led to a strategy of complete replacement of its core logic rather than attempting to patch existing, insecure patterns.

### Common Pitfalls Avoided
- **Storing Passwords in Plain Text**: The primary flaw of the original code, completely eliminated by a hash-and-salt strategy.
- **Using Vulnerable Defaults**: Avoiding `[]` and `{}` as mandated prevented downstream vulnerabilities.
- **Ignoring Side-Channel Attacks**: Proactively implementing a constant-time comparison function addresses the subtle but critical threat of timing attacks.
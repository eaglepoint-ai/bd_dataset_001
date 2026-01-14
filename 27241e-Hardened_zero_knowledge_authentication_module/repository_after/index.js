// FIX: Access 'webcrypto' specifically and alias it to 'crypto'
const { webcrypto: crypto } = require("node:crypto");

// Global Store: Exclusively using Map
const USERS = new Map();

// --- HELPER FUNCTIONS ---

function getBytes(text) {
  return new TextEncoder().encode(text);
}

async function generateHash(password, salt) {
  const passBuf = getBytes(password);
  const combined = new Uint8Array(passBuf.length + salt.length);
  combined.set(passBuf);
  combined.set(salt, passBuf.length);
  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  return new Uint8Array(hashBuffer);
}

function safeCompare(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

// --- CORE MODULE ---

async function registerUser(username, password) {
  // Now crypto.getRandomValues is defined
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await generateHash(password, salt);

  const user = Object.create(null);
  user.id = USERS.size + 1;
  user.username = username;
  user.salt = salt;
  user.hash = hash;
  Object.freeze(user);

  USERS.set(username, user);
  console.log("User registered:", username);
}

async function authenticate(username, password) {
  const user = USERS.get(username);
  if (!user) return false;
  const inputHash = await generateHash(password, user.salt);
  return safeCompare(user.hash, inputHash);
}

module.exports = { registerUser, authenticate };

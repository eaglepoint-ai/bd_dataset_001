#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const version = process.argv[2] || 'after';
const ROOT = path.join(__dirname, '..');
const REPO = path.join(ROOT, version === 'before' ? 'repository_before' : 'repository_after');

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    failed++;
    results.push({ name, status: 'FAIL', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(REPO, relativePath));
}

function readFile(relativePath) {
  const fullPath = path.join(REPO, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

console.log(`\n=== URL Shortener Tests (${version}) ===\n`);

test('Server package.json exists', () => {
  assert(fileExists('server/package.json'), 'server/package.json missing');
});

test('Server index.js exists', () => {
  assert(fileExists('server/src/index.js'), 'server/src/index.js missing');
});

test('Server db.js exists', () => {
  assert(fileExists('server/src/db.js'), 'server/src/db.js missing');
});

test('Server urls route exists', () => {
  assert(fileExists('server/src/routes/urls.js'), 'server/src/routes/urls.js missing');
});

test('Server redirect route exists', () => {
  assert(fileExists('server/src/routes/redirect.js'), 'server/src/routes/redirect.js missing');
});

test('Server validation utils exists', () => {
  assert(fileExists('server/src/utils/validation.js'), 'server/src/utils/validation.js missing');
});

test('Client package.json exists', () => {
  assert(fileExists('client/package.json'), 'client/package.json missing');
});

test('Client App.jsx exists', () => {
  assert(fileExists('client/src/App.jsx'), 'client/src/App.jsx missing');
});

test('Client UrlForm component exists', () => {
  assert(fileExists('client/src/components/UrlForm.jsx'), 'client/src/components/UrlForm.jsx missing');
});

test('Client UrlList component exists', () => {
  assert(fileExists('client/src/components/UrlList.jsx'), 'client/src/components/UrlList.jsx missing');
});

test('Server uses Express', () => {
  const content = readFile('server/src/index.js');
  assert(content.includes('express'), 'Should use express');
});

test('Server has CORS enabled', () => {
  const content = readFile('server/src/index.js');
  assert(content.includes('cors'), 'Should use cors');
});

test('Server has /api/urls route', () => {
  const content = readFile('server/src/index.js');
  assert(content.includes('/api/urls') || content.includes("'/api/urls'"), 'Should have /api/urls route');
});

test('Database uses SQLite', () => {
  const content = readFile('server/src/db.js');
  assert(content.includes('better-sqlite3') || content.includes('sqlite'), 'Should use SQLite');
});

test('Database has indexed short_code', () => {
  const content = readFile('server/src/db.js');
  assert(
    content.includes('INDEX') || content.includes('UNIQUE'),
    'Should have indexed short_code for O(1) lookup'
  );
});

test('URLs route has POST handler', () => {
  const content = readFile('server/src/routes/urls.js');
  assert(content.includes("router.post('/'") || content.includes('router.post("/'), 'Should have POST handler');
});

test('URLs route has GET handler', () => {
  const content = readFile('server/src/routes/urls.js');
  assert(content.includes("router.get('/'") || content.includes('router.get("/'), 'Should have GET handler');
});

test('Redirect route increments clicks', () => {
  const content = readFile('server/src/routes/redirect.js');
  assert(
    content.includes('clicks') && (content.includes('UPDATE') || content.includes('update')),
    'Should increment click count'
  );
});

test('Validation has URL checker', () => {
  const content = readFile('server/src/utils/validation.js');
  assert(content.includes('isValidUrl') || content.includes('URL'), 'Should validate URLs');
});

test('Validation has reserved words', () => {
  const content = readFile('server/src/utils/validation.js');
  assert(content.includes('api') && content.includes('admin'), 'Should have reserved words');
});

test('Error responses use proper codes', () => {
  const content = readFile('server/src/routes/urls.js');
  assert(
    content.includes('INVALID_URL') || content.includes('DUPLICATE_CODE'),
    'Should use proper error codes'
  );
});

test('Client uses React functional components', () => {
  const content = readFile('client/src/App.jsx');
  assert(
    content.includes('function App') || content.includes('const App'),
    'Should use functional components'
  );
  assert(!content.includes('class App'), 'Should not use class components');
});

test('Client uses useState', () => {
  const content = readFile('client/src/App.jsx');
  assert(content.includes('useState'), 'Should use useState hook');
});

test('UrlForm has URL input', () => {
  const content = readFile('client/src/components/UrlForm.jsx');
  assert(content.includes('input') && content.includes('url'), 'Should have URL input');
});

test('UrlForm has custom code input', () => {
  const content = readFile('client/src/components/UrlForm.jsx');
  assert(content.includes('customCode') || content.includes('custom'), 'Should have custom code input');
});

test('UrlForm has submit button', () => {
  const content = readFile('client/src/components/UrlForm.jsx');
  assert(content.includes('button') && content.includes('submit'), 'Should have submit button');
});

test('UrlList renders table', () => {
  const content = readFile('client/src/components/UrlList.jsx');
  assert(content.includes('table') || content.includes('Table'), 'Should render table');
});

test('UrlList shows clicks', () => {
  const content = readFile('client/src/components/UrlList.jsx');
  assert(content.includes('clicks') || content.includes('Clicks'), 'Should show click count');
});

test('UrlList has copy button', () => {
  const content = readFile('client/src/components/UrlList.jsx');
  assert(content.includes('copy') || content.includes('Copy'), 'Should have copy functionality');
});

test('UrlList has delete button', () => {
  const content = readFile('client/src/components/UrlList.jsx');
  assert(content.includes('delete') || content.includes('Delete'), 'Should have delete functionality');
});

test('Client shows error messages', () => {
  const appContent = readFile('client/src/App.jsx');
  const formContent = readFile('client/src/components/UrlForm.jsx');
  assert(
    appContent.includes('error') || formContent.includes('error'),
    'Should show error messages'
  );
});

console.log('\n' + '='.repeat(50));
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}

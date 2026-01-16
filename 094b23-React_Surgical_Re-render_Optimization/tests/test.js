
const fs = require('fs');
const path = require('path');


let repoPath, dashboardFile, itemFile, expectFeaturesPresent;
if (process.env.TEST_TARGET === 'before') {
  repoPath = path.join(__dirname, '..', 'repository_before');
  dashboardFile = path.join(repoPath, 'dashboard.js');
  itemFile = null; // No separate Item file in before version
  expectFeaturesPresent = false;
  console.log('Running tests against BEFORE (unoptimized) implementation.');
} else {
  repoPath = path.join(__dirname, '..', 'repository_after');
  dashboardFile = path.join(repoPath, 'src', 'components', 'Dashboard', 'Dashboard.jsx');
  itemFile = path.join(repoPath, 'src', 'components', 'Dashboard', 'Item.jsx');
  expectFeaturesPresent = true;
  console.log('Running tests against AFTER (optimized) implementation.');
}


// Regex-based feature checks for robust detection
const featureChecks = [
  {
    name: 'React.memo on Item',
    // Must be: const Item = React.memo(
    lineRegex: /^\s*const\s+Item\s*=\s*React\.memo\s*\(/,
    isOptimization: true,
    checkInItemFile: true // Check in Item.jsx for after version
  },
  {
    name: 'useCallback for handleUpdate',
    // Must be: const handleUpdate = useCallback(
    lineRegex: /^\s*const\s+handleUpdate\s*=\s*useCallback\s*\(/,
    isOptimization: true,
    checkInItemFile: false
  },
  {
    name: 'useReducer for state',
    // Must be: const [state, dispatch] = useReducer(
    lineRegex: /^\s*const\s*\[\s*state\s*,\s*dispatch\s*\]\s*=\s*useReducer\s*\(/,
    isOptimization: true,
    checkInItemFile: false
  },
  {
    name: 'search state separated',
    // Must be: const [search, setSearch] = useState(
    lineRegex: /^\s*const\s*\[\s*search\s*,\s*setSearch\s*\]\s*=\s*useState\s*\(/,
    isOptimization: false, // Both versions can have this
    checkInItemFile: false
  },
  {
    name: 'items state separated',
    // Must be: const [state, dispatch] = useReducer(
    lineRegex: /^\s*const\s*\[\s*state\s*,\s*dispatch\s*\]\s*=\s*useReducer\s*\(/,
    isOptimization: true,
    checkInItemFile: false
  },
  {
    name: 'console.log in Item',
    // Looks for console.log inside Item component (function or React.memo)
    // This is a best-effort check for a line with console.log in Item
    lineRegex: /^\s*console\.log\s*\(.*Rendering Item: \$\{item\.id\}.*\)/,
    isOptimization: false, // This is for demonstration, present in both versions
    checkInItemFile: true // Check in Item.jsx for after version
  }
];


function checkFeature(content, feature, lineRegex, expectPresent, isOptimization) {
  const lines = content.split(/\r?\n/);
  const matches = lines.filter(line => lineRegex.test(line));
  const hasFeature = matches.length > 0;
  
  let pass;
  let detail = '';
  
  if (expectPresent) {
    // For "after" version, all features should be present
    pass = hasFeature;
    detail = hasFeature ? ' (present)' : ' (missing)';
  } else {
    // For "before" version
    if (isOptimization) {
      // Optimization features should NOT be present
      pass = !hasFeature;
      detail = hasFeature ? ` (should NOT be present, matched: ${matches.join(' | ')})` : ' (not present)';
    } else {
      // Non-optimization features - just report status, always pass
      pass = true;
      detail = hasFeature ? ' (present - OK for before)' : ' (not present - OK for before)';
    }
  }
  
  const status = pass ? 'PASS' : 'FAIL';
  console.log(`${feature}: ${status}${detail}`);
  return pass;
}

function main() {
  if (!fs.existsSync(dashboardFile)) {
    console.log(`Dashboard file not found at ${dashboardFile}: FAIL`);
    process.exit(1);
  }

  const dashboardContent = fs.readFileSync(dashboardFile, 'utf8');
  let itemContent = '';
  
  // Read Item file if it exists (for after version)
  if (itemFile && fs.existsSync(itemFile)) {
    itemContent = fs.readFileSync(itemFile, 'utf8');
  }

  let allPassed = true;

  for (const feature of featureChecks) {
    // For after version with separate Item file, check Item-specific features in Item.jsx
    const contentToCheck = (expectFeaturesPresent && feature.checkInItemFile && itemContent) 
      ? itemContent 
      : dashboardContent;
    
    const passed = checkFeature(contentToCheck, feature.name, feature.lineRegex, expectFeaturesPresent, feature.isOptimization);
    if (!passed) allPassed = false;
  }

  process.exit(allPassed ? 0 : 1);
}

main();



const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const APP_BEFORE = path.join(REPO_ROOT, 'repository_before', 'enterprise-dashboard', 'src', 'App.js');
const APP_AFTER = path.join(REPO_ROOT, 'repository_after', 'enterprise-dashboard', 'src', 'App.js');
const PKG_AFTER = path.join(REPO_ROOT, 'repository_after', 'enterprise-dashboard', 'package.json');

function readFileOrNull(p) {
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
}

function boolPassFail(name, passed, details = '') {
    return { name, passed, details };
}

function countRegex(content, re) {
    const m = content.match(re);
    return m ? m.length : 0;
}

function analyzeAppJS(content) {
    const checks = [];
    const hasPromiseAll = content.includes('Promise.all(') || content.includes('Promise.all([');
    const hasCoordinatorLog = /Initiating Dashboard Data Coordination|Parallel Requests executed/i.test(content);

    checks.push(boolPassFail(
        'REQ-2: Parallel coordinator exists (Promise.all)',
        hasPromiseAll,
        hasPromiseAll ? '' : 'Missing Promise.all coordinator for parallel fetch.'
    ));
    const promiseAllBlockMatch = content.match(/Promise\.all\s*\(\s*\[([\s\S]*?)\]\s*\)/m);
    let coordinatorCalls = 0;
    let coordinatorCallsDetails = '';
    if (promiseAllBlockMatch) {
        const block = promiseAllBlockMatch[1];
        // Count originalMockAPI.getX calls inside this Promise.all
        coordinatorCalls =
            countRegex(block, /originalMockAPI\.getUserProfile\s*\(/g) +
            countRegex(block, /originalMockAPI\.getNotifications\s*\(/g) +
            countRegex(block, /originalMockAPI\.getProjects\s*\(/g);

        coordinatorCallsDetails = `Detected ${coordinatorCalls} coordinator calls in Promise.all block.`;
    } else {
        coordinatorCallsDetails = 'Could not locate Promise.all([...]) block for coordinator.';
    }

    checks.push(boolPassFail(
        'REQ-1: Coordinator fires exactly 3 top-level API calls (profile/notifications/projects)',
        coordinatorCalls === 3,
        coordinatorCallsDetails
    ));


    const hasPerProjectTasksInCoordinatorPath =
        /getProjects\s*\([\s\S]*includeDetails[\s\S]*\)[\s\S]*(getProjectTasks|getTeamMembers)\s*\(/m.test(content) ||
        /for\s*\([\s\S]*of\s+projects[\s\S]*\)\s*\{[\s\S]*(getProjectTasks|getTeamMembers)\s*\(/m.test(content) ||
        /projects\.map\s*\([\s\S]*=>[\s\S]*(getProjectTasks|getTeamMembers)\s*\(/m.test(content);

    checks.push(boolPassFail(
        'REQ-1 Scalability: No per-project task/team fetching loops in frontend (prevents 2N+3)',
        !hasPerProjectTasksInCoordinatorPath,
        hasPerProjectTasksInCoordinatorPath
            ? 'Found task/team fetching tied to projects loop; this implies >3 total requests as N grows.'
            : ''
    ));

    const hasAwaitBeforePromiseAllInEffect = /useEffect\s*\([\s\S]*async\s*\(\)\s*=>\s*\{[\s\S]*await[\s\S]*Promise\.all/m.test(content);
    checks.push(boolPassFail(
        'REQ-2 Parallel initiation: No await before Promise.all in coordinator effect (same tick start)',
        !hasAwaitBeforePromiseAllInEffect,
        hasAwaitBeforePromiseAllInEffect ? 'There is an await before Promise.all; may delay parallel start.' : ''
    ));

    const forbiddenImport = /(react-query|@tanstack\/react-query|swr|apollo|zustand|redux|mobx)/i.test(content);
    checks.push(boolPassFail(
        'REQ-5: No third-party state/data-fetch libraries imported',
        !forbiddenImport,
        forbiddenImport ? 'Detected forbidden library import usage.' : ''
    ));

    // API functions individually callable: ensure originalMockAPI still exists with methods
    const hasOriginalAPI = /const\s+originalMockAPI\s*=\s*\{[\s\S]*getUserProfile[\s\S]*getProjects[\s\S]*getProjectTasks[\s\S]*getNotifications[\s\S]*getTeamMembers/m.test(content);
    checks.push(boolPassFail(
        'REQ-6: API utilities remain individually callable (original API preserved)',
        hasOriginalAPI,
        hasOriginalAPI ? '' : 'originalMockAPI definition missing or incomplete.'
    ));

    // Backward compatibility layer: Proxy with fallback to original
    const hasProxy = /new\s+Proxy\s*\(\s*originalMockAPI\s*,\s*\{[\s\S]*get\s*:\s*\([\s\S]*\)\s*=>/m.test(content);
    const hasFallback = hasProxy && /(return\s+target\[prop\]\(\.\.\.args\)|Reflect\.apply|Reflect\.get)/m.test(content);
    checks.push(boolPassFail(
        'REQ-3: Backward compatibility layer (Proxy) present',
        hasProxy,
        hasProxy ? '' : 'Proxy wrapper missing.'
    ));
    checks.push(boolPassFail(
        'REQ-4: Component isolation fallback (Proxy falls back to original API)',
        hasFallback,
        hasFallback ? '' : 'Proxy fallback to original API missing.'
    ));

    const signatures = [
        { name: 'UserProfile signature unchanged', re: /const\s+UserProfile\s*=\s*\(\{\s*userId\s*\}\)\s*=>/ },
        { name: 'Notifications signature unchanged', re: /const\s+Notifications\s*=\s*\(\{\s*userId\s*\}\)\s*=>/ },
        { name: 'ProjectsList signature unchanged', re: /const\s+ProjectsList\s*=\s*\(\{\s*userId\s*\}\)\s*=>/ },
        { name: 'ProjectCard signature unchanged', re: /const\s+ProjectCard\s*=\s*\(\{\s*project\s*\}\)\s*=>/ },
    ];
    for (const s of signatures) {
        checks.push(boolPassFail(
            `REQ-4/No breaking changes: ${s.name}`,
            s.re.test(content),
            s.re.test(content) ? '' : `Could not find expected component signature for ${s.name}.`
        ));
    }
    const componentUsesOriginalAPI =
        /const\s+UserProfile[\s\S]*originalMockAPI\.getUserProfile/m.test(content) ||
        /const\s+Notifications[\s\S]*originalMockAPI\.getNotifications/m.test(content) ||
        /const\s+ProjectsList[\s\S]*originalMockAPI\.getProjects/m.test(content) ||
        /const\s+ProjectCard[\s\S]*originalMockAPI\.(getProjectTasks|getTeamMembers)/m.test(content);

    checks.push(boolPassFail(
        'VAL-2: Components use compatibility API (mockAPI) not originalMockAPI directly',
        !componentUsesOriginalAPI,
        componentUsesOriginalAPI ? 'One or more components call originalMockAPI directly; breaks isolation/caching pattern.' : ''
    ));
    const hasGlobalGate = /if\s*\(\s*context\.loading\s*\)\s*return\s*<div[^>]*>\s*Initializing Dashboard/i.test(content);
    checks.push(boolPassFail(
        'VAL-4: Progressive rendering (no single global loading gate blocking all sections)',
        !hasGlobalGate,
        hasGlobalGate ? 'Found a global loading gate that blocks entire dashboard; not progressive.' : ''
    ));
    const hasGlobalErrorGate = /if\s*\(\s*context\.error\s*\)\s*return\s*<div[^>]*>\s*Error loading dashboard/i.test(content);
    checks.push(boolPassFail(
        'VAL-6: Error isolation (no single global error gate blocking entire dashboard)',
        !hasGlobalErrorGate,
        hasGlobalErrorGate ? 'Found a global error gate; one failing request would block entire dashboard.' : ''
    ));
    const hasProjectDetailsMap = /projectDetails\s*:\s*\{\s*\}/.test(content) || /DataCache\.projectDetails/.test(content);
    const hasMergePattern = /Object\.assign\s*\(\s*DataCache\.projectDetails|DataCache\.projectDetails\s*=\s*\{\s*\.\.\.DataCache\.projectDetails/m.test(content);

    checks.push(boolPassFail(
        'VAL-5: Incremental updates support (projectDetails is a map; merge pattern exists)',
        hasProjectDetailsMap && hasMergePattern,
        (hasProjectDetailsMap && hasMergePattern) ? '' : 'Missing clear projectDetails map merge; incremental updates may refetch or overwrite.'
    ));


    const cacheHasUserKeying = /DataCache\.(userId|byUser|users)\b/.test(content) || /DataCache\s*=\s*\{[\s\S]*byUser/m.test(content);
    checks.push(boolPassFail(
        'PROD: Cache keyed by userId (prevents cross-user bleed)',
        cacheHasUserKeying,
        cacheHasUserKeying ? '' : 'DataCache appears global without userId keying.'
    ));

    // In-flight dedupe: presence of Promise cache (e.g., inFlight map)
    const hasInFlight = /inFlight|inflight|pendingRequests|promiseCache/.test(content);
    checks.push(boolPassFail(
        'PROD: In-flight request deduping (prevents duplicate calls during prefetch)',
        hasInFlight,
        hasInFlight ? '' : 'No in-flight/promise cache detected; duplicates may occur during mount.'
    ));

    // Architectural comments required
    const hasComments = /ARCHITECTURAL REQUIREMENTS|REFACTOR START|Parallel Request Coordinator|Backward Compatibility|Data Distribution/i.test(content);
    checks.push(boolPassFail(
        'DONE: Inline architectural comments present',
        hasComments,
        hasComments ? '' : 'Missing required architectural comments markers.'
    ));

    // Bundle size: verify no new deps via package.json analysis separately.
    return checks;
}

function analyzePackageJSON(pkgContent) {
    const checks = [];

    if (!pkgContent) {
        checks.push(boolPassFail(
            'BUNDLE: package.json exists for dependency verification',
            false,
            'package.json not found; cannot verify no dependency increases.'
        ));
        return checks;
    }

    let pkg;
    try {
        pkg = JSON.parse(pkgContent);
    } catch (e) {
        checks.push(boolPassFail(
            'BUNDLE: package.json is valid JSON',
            false,
            'package.json JSON parse failed.'
        ));
        return checks;
    }

    const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
    const forbidden = ['redux', 'zustand', 'mobx', 'swr', '@tanstack/react-query', 'react-query', '@apollo/client', 'apollo-client'];

    const foundForbidden = forbidden.filter(d => deps[d]);
    checks.push(boolPassFail(
        'REQ-5: No forbidden dependencies added (redux/zustand/react-query/swr/apollo)',
        foundForbidden.length === 0,
        foundForbidden.length ? `Found forbidden deps: ${foundForbidden.join(', ')}` : ''
    ));
    const depCount = Object.keys(deps).length;
    checks.push(boolPassFail(
        'BUNDLE (heuristic): Dependency count present (used as a regression signal, not proof of <5KB)',
        depCount > 0,
        `Total deps+devDeps count: ${depCount}`
    ));

    return checks;
}

function analyzeFile(filePath, label, pkgPath = null) {
    console.log(`\n==================================================`);
    console.log(`Analyzing: ${label}`);
    console.log(`Path: ${filePath}`);
    console.log(`==================================================`);

    const content = readFileOrNull(filePath);
    if (!content) {
        console.error(`❌ File not found: ${filePath}`);
        return { success: false, checks: [boolPassFail('File exists', false, 'Missing file')] };
    }

    const checks = analyzeAppJS(content);

    // package.json checks (only for AFTER)
    if (pkgPath) {
        const pkgContent = readFileOrNull(pkgPath);
        checks.push(...analyzePackageJSON(pkgContent));
    }

    // Reporting
    const total = checks.length;
    const passed = checks.filter(c => c.passed).length;
    const success = passed === total;

    const logBuffer = [];
    logBuffer.push(`\nResult for ${label}:`);
    for (const c of checks) {
        logBuffer.push(`${c.passed ? '[PASS]' : '[FAIL]'} ${c.name}${c.details ? ` — ${c.details}` : ''}`);
    }
    logBuffer.push(`Summary: ${passed}/${total} Checks Passed\n`);

    fs.appendFileSync('verification_results.log', logBuffer.join('\n') + '\n');
    console.log(logBuffer.join('\n'));

    return { success, checks };
}

function main() {
    const target = process.env.TARGET || 'all';

    if (fs.existsSync('verification_results.log')) {
        fs.unlinkSync('verification_results.log');
    }

    console.log(`STARTING VERIFICATION SUITE (Target: ${target})\n`);

    let failure = false;

    if (target === 'before' || target === 'all') {
        const before = analyzeFile(APP_BEFORE, 'Repository Before');
        if (!before.success) failure = true;

    }

    if (target === 'after' || target === 'all') {
        const after = analyzeFile(APP_AFTER, 'Repository After', PKG_AFTER);
        if (!after.success) failure = true;
    }

    const summary = [];
    summary.push('\n--- FINAL SUMMARY ---');

    if (failure) {
        summary.push(`[FAIL] Verification failed for target: ${target}`);
        summary.push('       Review verification_results.log for details.');
    } else {
        summary.push(`[PASS] Verification succeeded for target: ${target}`);
    }

    fs.appendFileSync('verification_results.log', summary.join('\n') + '\n');
    console.log(summary.join('\n'));

    process.exit(failure ? 1 : 0);
}

main();

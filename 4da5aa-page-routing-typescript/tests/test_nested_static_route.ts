import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'dashboard/settings/page.tsx': 'export default function Settings() {}',
    });

    const router = new Router(root);
    const result = router.resolve('/dashboard/settings');

    assert.ok(result, 'Result should not be null');
    assert.strictEqual(result?.url, '/dashboard/settings');
    console.log('[PASS] Test 3: Nested Static Route');
} catch (e) {
    console.error('[FAIL] Test 3: Nested Static Route', e);
    process.exit(1);
} finally {
    cleanup();
}

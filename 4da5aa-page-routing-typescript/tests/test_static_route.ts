import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'about/page.tsx': 'export default function About() {}',
    });

    const router = new Router(root);
    const result = router.resolve('/about');

    assert.ok(result, 'Result should not be null');
    assert.strictEqual(result?.url, '/about');
    assert.strictEqual(result?.components.length, 1);
    console.log('[PASS] Test 2: Static Route');
} catch (e) {
    console.error('[FAIL] Test 2: Static Route', e);
    process.exit(1);
} finally {
    cleanup();
}

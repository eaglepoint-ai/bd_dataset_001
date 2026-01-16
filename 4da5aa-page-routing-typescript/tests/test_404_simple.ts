import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'page.tsx': 'export default function Root() {}',
    });

    const router = new Router(root);
    const result = router.resolve('/unknown');

    assert.strictEqual(result, null, 'Should return null for unknown route');
    console.log('[PASS] Test 8: 404 Simple');
} catch (e) {
    console.error('[FAIL] Test 8: 404 Simple', e);
    process.exit(1);
} finally {
    cleanup();
}

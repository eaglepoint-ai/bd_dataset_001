import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'blog/[slug]/page.tsx': 'export default function Post() {}',
    });

    const router = new Router(root);
    // Too deep
    const result = router.resolve('/blog/hello/extra');

    assert.strictEqual(result, null, 'Should return null for too deep route');
    console.log('[PASS] Test 9: 404 Nested');
} catch (e) {
    console.error('[FAIL] Test 9: 404 Nested', e);
    process.exit(1);
} finally {
    cleanup();
}

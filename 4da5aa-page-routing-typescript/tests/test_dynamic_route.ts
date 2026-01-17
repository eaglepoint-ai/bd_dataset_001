import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'blog/[slug]/page.tsx': 'export default function Post() {}',
    });

    const router = new Router(root);
    const result = router.resolve('/blog/my-first-post');

    assert.ok(result, 'Result should not be null');
    assert.strictEqual(result?.params['slug'], 'my-first-post');
    console.log('[PASS] Test 4: Dynamic Route');
} catch (e) {
    console.error('[FAIL] Test 4: Dynamic Route', e);
    process.exit(1);
} finally {
    cleanup();
}

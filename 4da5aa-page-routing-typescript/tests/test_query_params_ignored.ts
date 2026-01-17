import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'search/page.tsx': 'export default function Search() {}',
    });

    const router = new Router(root);
    const result = router.resolve('/search?q=hello');

    assert.ok(result);
    assert.strictEqual(result?.components[0].type, 'page');
    console.log('[PASS] Test 14: Query Params Ignored');
} catch (e) {
    console.error('[FAIL] Test 14: Query Params Ignored', e);
    process.exit(1);
} finally {
    cleanup();
}

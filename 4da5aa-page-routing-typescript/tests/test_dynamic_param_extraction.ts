import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'docs/[version]/[page]/page.tsx': 'export default function Doc() {}',
    });

    const router = new Router(root);
    const result = router.resolve('/docs/v1.0/intro');

    assert.ok(result);
    assert.deepStrictEqual(result?.params, {
        version: 'v1.0',
        page: 'intro'
    });
    console.log('[PASS] Test 15: Dynamic Param Extraction');
} catch (e) {
    console.error('[FAIL] Test 15: Dynamic Param Extraction', e);
    process.exit(1);
} finally {
    cleanup();
}

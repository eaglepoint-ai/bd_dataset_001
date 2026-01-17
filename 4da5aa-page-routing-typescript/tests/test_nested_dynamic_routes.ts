import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'shop/[category]/[item]/page.tsx': 'export default function Item() {}',
    });

    const router = new Router(root);
    const result = router.resolve('/shop/electronics/iphone');

    assert.ok(result, 'Result should not be null');
    assert.strictEqual(result?.params['category'], 'electronics');
    assert.strictEqual(result?.params['item'], 'iphone');
    console.log('[PASS] Test 5: Multiple Dynamic Routes');
} catch (e) {
    console.error('[FAIL] Test 5: Multiple Dynamic Routes', e);
    process.exit(1);
} finally {
    cleanup();
}

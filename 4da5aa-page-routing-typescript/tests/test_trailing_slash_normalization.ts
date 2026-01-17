import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'about/page.tsx': 'export default function About() {}',
    });

    const router = new Router(root);

    // Test trailing slash
    const result1 = router.resolve('/about/');
    assert.ok(result1, 'Should handle trailing slash');
    assert.strictEqual(result1?.url, '/about/'); // Original URL preserved? Or we can check it returns correct route

    // Test multiple slashes
    const result2 = router.resolve('//about//');
    assert.ok(result2, 'Should handle multiple slashes');

    console.log('[PASS] Test 13: Normalization Trims Slashes');
} catch (e) {
    console.error('[FAIL] Test 13: Normalization Trims Slashes', e);
    process.exit(1);
} finally {
    cleanup();
}

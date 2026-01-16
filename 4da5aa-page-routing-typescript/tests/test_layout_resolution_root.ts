import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'layout.tsx': 'export default function RootLayout() {}',
        'page.tsx': 'export default function Root() {}',
    });

    const router = new Router(root);
    const result = router.resolve('/');

    assert.ok(result);
    // Should have 2 components: Layout then Page
    assert.strictEqual(result!.components.length, 2);
    assert.strictEqual(result!.components[0].type, 'layout');
    assert.strictEqual(result!.components[1].type, 'page');
    console.log('[PASS] Test 10: Layout Resolution Root');
} catch (e) {
    console.error('[FAIL] Test 10: Layout Resolution Root', e);
    process.exit(1);
} finally {
    cleanup();
}

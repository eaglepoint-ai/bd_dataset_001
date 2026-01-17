import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'layout.tsx': 'export default function RootLayout() {}',
        'dashboard/layout.tsx': 'export default function DashLayout() {}',
        'dashboard/settings/page.tsx': 'export default function Settings() {}',
    });

    const router = new Router(root);
    const result = router.resolve('/dashboard/settings');

    assert.ok(result);
    // RootLayout -> DashLayout -> Page
    assert.strictEqual(result!.components.length, 3);
    assert.strictEqual(result!.components[0].type, 'layout'); // Root
    assert.strictEqual(result!.components[1].type, 'layout'); // Dash
    assert.strictEqual(result!.components[2].type, 'page');   // Page
    console.log('[PASS] Test 11: Layout Resolution Nested');
} catch (e) {
    console.error('[FAIL] Test 11: Layout Resolution Nested', e);
    process.exit(1);
} finally {
    cleanup();
}

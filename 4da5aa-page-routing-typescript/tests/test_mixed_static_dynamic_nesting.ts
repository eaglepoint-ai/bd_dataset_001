import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'users/[id]/settings/page.tsx': 'export default function UserSettings() {}',
    });

    const router = new Router(root);
    const result = router.resolve('/users/123/settings');

    assert.ok(result, 'Result should not be null');
    assert.strictEqual(result?.params['id'], '123');
    console.log('[PASS] Test 6: Mixed Static and Dynamic Nesting');
} catch (e) {
    console.error('[FAIL] Test 6: Mixed Static and Dynamic Nesting', e);
    process.exit(1);
} finally {
    cleanup();
}

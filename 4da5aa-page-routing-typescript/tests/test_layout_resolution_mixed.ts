import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'layout.tsx': 'export default function RootLayout() {}',
        'blog/[slug]/layout.tsx': 'export default function PostLayout() {}',
        'blog/[slug]/page.tsx': 'export default function Post() {}',
    });

    const router = new Router(root);
    const result = router.resolve('/blog/my-post');

    assert.ok(result);
    // RootLayout -> PostLayout -> Page
    assert.strictEqual(result!.components.length, 3);
    console.log('[PASS] Test 12: Layout Resolution Mixed');
} catch (e) {
    console.error('[FAIL] Test 12: Layout Resolution Mixed', e);
    process.exit(1);
} finally {
    cleanup();
}

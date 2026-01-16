import { Router } from 'src/router';
import { createStructure, cleanup } from './setup';
import * as assert from 'assert';

try {
    const root = createStructure({
        'blog/new/page.tsx': 'export default function NewPost() {}',
        'blog/[slug]/page.tsx': 'export default function Post() {}',
    });

    const router = new Router(root);

    // Should match static 'new'
    const result1 = router.resolve('/blog/new');
    assert.ok(result1);
    assert.strictEqual(Object.keys(result1!.params).length, 0); // No params for static match

    // Should match dynamic [slug]
    const result2 = router.resolve('/blog/hello');
    assert.ok(result2);
    assert.strictEqual(result2!.params['slug'], 'hello');

    console.log('[PASS] Test 7: Priority Static Over Dynamic');
} catch (e) {
    console.error('[FAIL] Test 7: Priority Static Over Dynamic', e);
    process.exit(1);
} finally {
    cleanup();
}

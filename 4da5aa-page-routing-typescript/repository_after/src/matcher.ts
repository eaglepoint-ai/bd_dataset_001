import { RouteNode, MatchResult } from './types';

export function matchUrl(url: string, root: RouteNode): MatchResult | null {
    // Normalize URL: remove leading/trailing slashes, split
    const urlPath = url.split('?')[0]; // Ignore query params for now
    const segments = urlPath.split('/').filter(Boolean);

    const matchedParams: Record<string, string> = {};
    const componentStack: { componentPath: string; type: 'layout' | 'page' }[] = [];

    // Helper to collect layouts from root down to current node
    function collectLayouts(node: RouteNode) {
        const stack: { componentPath: string; type: 'layout' | 'page' }[] = [];
        let current: RouteNode | undefined = node;
        while (current) {
            if (current.layoutComponent) {
                stack.unshift({ componentPath: current.layoutComponent, type: 'layout' });
            }
            current = current.parent;
        }
        return stack;
    }

    // Recursive match function
    function findMatch(node: RouteNode, segmentIndex: number): MatchResult | null {
        // Determine if we are at the end of the URL
        if (segmentIndex >= segments.length) {
            // If we are at the end, checks if this node has a page.
            if (node.pageComponent) {
                // Success!
                const stack = collectLayouts(node);
                stack.push({ componentPath: node.pageComponent!, type: 'page' });

                return {
                    url,
                    params: { ...matchedParams },
                    components: stack
                };
            }
            return null;
        }

        const currentSegment = segments[segmentIndex];

        // Priority 1: Static Match
        const staticChild = node.children.find(child => !child.isDynamic && child.segment === currentSegment);
        if (staticChild) {
            return findMatch(staticChild, segmentIndex + 1);
        }

        // Priority 2: Dynamic Match
        const dynamicChild = node.children.find(child => child.isDynamic);
        if (dynamicChild) {
            if (dynamicChild.dynamicParam) {
                matchedParams[dynamicChild.dynamicParam] = currentSegment;
            }
            const result = findMatch(dynamicChild, segmentIndex + 1);
            if (result) return result;
            // If backtracking, remove param
            if (dynamicChild.dynamicParam) {
                delete matchedParams[dynamicChild.dynamicParam];
            }
        }

        return null;
    }

    // Handle root route specially
    if (segments.length === 0) {
        if (root.pageComponent) {
            const stack = collectLayouts(root);
            stack.push({ componentPath: root.pageComponent!, type: 'page' });
            return {
                url,
                params: {},
                components: stack
            };
        }
        return null;
    }

    return findMatch(root, 0);
}

import * as fs from 'fs';
import * as path from 'path';
import { RouteNode } from './types';

export function buildRouteTree(rootDir: string, segment: string = '', parent?: RouteNode): RouteNode {
    const node: RouteNode = {
        segment,
        isDynamic: segment.startsWith('[') && segment.endsWith(']'),
        dynamicParam: segment.startsWith('[') && segment.endsWith(']') ? segment.slice(1, -1) : undefined,
        children: [],
        parent
    };

    // Check for special files
    const layoutPath = path.join(rootDir, 'layout.tsx');
    if (fs.existsSync(layoutPath)) {
        node.layoutComponent = layoutPath;
    }

    const pagePath = path.join(rootDir, 'page.tsx');
    if (fs.existsSync(pagePath)) {
        node.pageComponent = pagePath;
    }

    // Scan for subdirectories
    if (fs.existsSync(rootDir)) {
        const items = fs.readdirSync(rootDir, { withFileTypes: true });
        for (const item of items) {
            if (item.isDirectory()) {
                const childNode = buildRouteTree(path.join(rootDir, item.name), item.name, node);
                // Only add if it has some meaningful content (or children)
                // For simplicity, we add all directories as potential segments
                node.children.push(childNode);
            }
        }
    }

    return node;
}

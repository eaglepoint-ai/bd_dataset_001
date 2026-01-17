export type ComponentType = any; // Placeholder for React Component

export interface RouteNode {
    segment: string;
    isDynamic: boolean;
    dynamicParam?: string; // e.g., 'slug' for [slug]

    // File paths for components at this level
    layoutComponent?: string;
    pageComponent?: string;

    children: RouteNode[];
    parent?: RouteNode;
}

export interface MatchResult {
    url: string;
    params: Record<string, string>;

    // The stack of components to render, from root to leaf
    // structured as [RootLayout, NestedLayout, ..., Page]
    components: {
        componentPath: string;
        type: 'layout' | 'page';
    }[];
}

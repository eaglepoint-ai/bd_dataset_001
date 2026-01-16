import { buildRouteTree } from './scanner';
import { matchUrl } from './matcher';
import { RouteNode, MatchResult } from './types';

export class Router {
    private root: RouteNode;

    constructor(private pagesDir: string) {
        this.root = buildRouteTree(pagesDir);
    }

    public resolve(url: string): MatchResult | null {
        return matchUrl(url, this.root);
    }

    public getRouteTree(): RouteNode {
        return this.root;
    }
}

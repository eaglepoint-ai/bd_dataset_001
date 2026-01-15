export type Route = 'home' | 'post';

export interface RouteHandler {
  (params?: Record<string, string>): void;
}

class Router {
  private routes: Map<string, RouteHandler> = new Map();
  private currentRoute: string = 'home';
  
  constructor() {
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });

    // Hash-based routing: clicking <a href="#..."> updates location.hash
    // and triggers hashchange without any full page reload.
    window.addEventListener('hashchange', () => {
      this.handleRoute();
    });
  }
  
  register(path: string, handler: RouteHandler): void {
    this.routes.set(path, handler);
  }
  
  navigate(path: string, params?: Record<string, string>): void {
    this.currentRoute = path;
    let hash = `#${path}`;
    if (params) {
      const paramString = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      hash += `?${paramString}`;
    }
    window.location.hash = hash;
  }
  
  private handleRoute(params?: Record<string, string>): void {
    const hash = window.location.hash.slice(1);
    const [route, queryString] = hash.split('?');
    const finalRoute = route || 'home';
    this.currentRoute = finalRoute;
    
    const finalParams: Record<string, string> = params ? { ...params } : {};
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          finalParams[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    }
    
    const handler = this.routes.get(finalRoute);
    if (handler) {
      handler(Object.keys(finalParams).length > 0 ? finalParams : undefined);
    } else {
      const defaultHandler = this.routes.get('home');
      if (defaultHandler) {
        defaultHandler();
      }
    }
  }
  
  getCurrentRoute(): string {
    return this.currentRoute;
  }
  
  init(): void {
    this.handleRoute();
  }
}

export const router = new Router();

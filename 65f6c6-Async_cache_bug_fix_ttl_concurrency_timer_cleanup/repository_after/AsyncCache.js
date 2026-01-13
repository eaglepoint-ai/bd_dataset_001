class AsyncCache {
  constructor(defaultTTL = 0) {
    this.defaultTTL = defaultTTL;
    this.store = new Map(); // key -> entry
  }

  _now() {
    return Date.now();
  }

  _isExpired(entry) {
    return entry.expiresAt !== null && this._now() > entry.expiresAt;
  }

  _cleanupIfExpired(key, entry) {
    if (this._isExpired(entry)) {
      this._clearEntry(key, entry);
      return true;
    }
    return false;
  }

  _clearEntry(key, entry) {
    if (entry.timer) {
      clearTimeout(entry.timer);
    }
    this.store.delete(key);
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = ttl > 0 ? this._now() + ttl : null;

    // Remove old entry if exists
    if (this.store.has(key)) {
      this._clearEntry(key, this.store.get(key));
    }

    let timer = null;
    if (expiresAt !== null) {
      timer = setTimeout(() => {
        this.store.delete(key);
      }, ttl);
    }

    this.store.set(key, {
      value,
      promise: null,
      expiresAt,
      timer,
    });
  }

  async get(key, loader, ttl = this.defaultTTL) {
    const existing = this.store.get(key);

    // Return cached value if valid
    if (existing && !this._cleanupIfExpired(key, existing)) {
      if (existing.value !== undefined) {
        return existing.value;
      }
      if (existing.promise) {
        return existing.promise;
      }
    }

    // Ensure only one loader runs concurrently
    let resolveFn, rejectFn;
    const promise = new Promise((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });

    const expiresAt = ttl > 0 ? this._now() + ttl : null;

    const entry = {
      value: undefined,
      promise,
      expiresAt,
      timer: null,
    };

    if (expiresAt !== null) {
      entry.timer = setTimeout(() => {
        this.store.delete(key);
      }, ttl);
    }

    this.store.set(key, entry);

    try {
      const result = await loader();
      entry.value = result;
      entry.promise = null;
      resolveFn(result);
      return result;
    } catch (err) {
      // Important: allow retry by removing failed entry
      this._clearEntry(key, entry);
      rejectFn(err);
      throw err;
    }
  }

  delete(key) {
    const entry = this.store.get(key);
    if (entry) {
      this._clearEntry(key, entry);
      return true;
    }
    return false;
  }

  clear() {
    for (const [key, entry] of this.store.entries()) {
      this._clearEntry(key, entry);
    }
  }

  has(key) {
    const entry = this.store.get(key);
    if (!entry) return false;
    return !this._cleanupIfExpired(key, entry);
  }

  get size() {
    // Remove expired entries lazily
    for (const [key, entry] of this.store.entries()) {
      this._cleanupIfExpired(key, entry);
    }
    return this.store.size;
  }

  keys() {
    for (const [key, entry] of this.store.entries()) {
      this._cleanupIfExpired(key, entry);
    }
    return Array.from(this.store.keys());
  }
}

module.exports = AsyncCache;

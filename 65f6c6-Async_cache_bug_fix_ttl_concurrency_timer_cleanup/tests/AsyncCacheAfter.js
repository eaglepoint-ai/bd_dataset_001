class AsyncCache {
  constructor(defaultTTL = null) {
    this.cache = new Map();
    this.promises = new Map(); // Tracks in-flight loaders
    this.timers = new Map();
    this.defaultTTL = defaultTTL;
  }

  async get(key, loader, ttl) {
    // 1. Check for valid cached data (lazy cleanup of expired items)
    if (this.has(key)) {
      return this.cache.get(key).value;
    }

    // 2. Handle Concurrent Access (Deduplication)
    if (this.promises.has(key)) {
      return this.promises.get(key);
    }

    // 3. Execute loader and track the promise
    const promise = (async () => {
      try {
        const value = await loader();
        this.set(key, value, ttl);
        return value;
      } finally {
        // 4. Handle Errors & Cleanup: Remove from pending so next call can retry
        this.promises.delete(key);
      }
    })();

    this.promises.set(key, promise);
    return promise;
  }

  set(key, value, ttl) {
    // Ensure we clear any existing timer for this key (Memory Leak Fix)
    this._clearTimer(key);

    const effectiveTTL = ttl ?? this.defaultTTL;
    const expiresAt = effectiveTTL ? Date.now() + effectiveTTL : null;

    this.cache.set(key, { value, expiresAt });

    if (effectiveTTL) {
      const timer = setTimeout(() => this.delete(key), effectiveTTL);
      this.timers.set(key, timer);
    }
  }

  delete(key) {
    this._clearTimer(key);
    return this.cache.delete(key);
  }

  clear() {
    // Clear all timers to prevent memory leaks
    for (const key of this.timers.keys()) {
      this._clearTimer(key);
    }
    this.cache.clear();
    this.promises.clear();
  }

  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this._isExpired(entry)) {
      this.delete(key); // Lazy cleanup
      return false;
    }
    return true;
  }

  get size() {
    this._purgeExpired();
    return this.cache.size;
  }

  keys() {
    this._purgeExpired();
    return Array.from(this.cache.keys());
  }

  // --- Private Helpers ---

  _isExpired(entry) {
    return entry.expiresAt !== null && Date.now() >= entry.expiresAt;
  }

  _clearTimer(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  _purgeExpired() {
    for (const [key, entry] of this.cache.entries()) {
      if (this._isExpired(entry)) {
        this.delete(key);
      }
    }
  }
}

module.exports = AsyncCache;










// class AsyncCache {
//   constructor(defaultTTL = 0) {
//     this.defaultTTL = defaultTTL;
//     this.store = new Map(); // key -> entry
//   }

//   _now() {
//     return Date.now();
//   }

//   _isExpired(entry) {
//     return entry.expiresAt !== null && this._now() > entry.expiresAt;
//   }

//   _cleanupIfExpired(key, entry) {
//     if (this._isExpired(entry)) {
//       this._clearEntry(key, entry);
//       return true;
//     }
//     return false;
//   }

//   _clearEntry(key, entry) {
//   if (entry.timer) {
//     clearTimeout(entry.timer);
//     entry.timer.unref?.();   // safe if supported
//     entry.timer = null;
//   }
//   this.store.delete(key);
// }


//   set(key, value, ttl = this.defaultTTL) {
//     const expiresAt = ttl > 0 ? this._now() + ttl : null;

//     // Remove old entry if exists
//     if (this.store.has(key)) {
//       this._clearEntry(key, this.store.get(key));
//     }

//     let timer = null;
//     if (expiresAt !== null) {
//       timer = setTimeout(() => {
//         this.store.delete(key);
//       }, ttl);
//     }

//     this.store.set(key, {
//       value,
//       promise: null,
//       expiresAt,
//       timer,
//     });
//   }

//   async get(key, loader, ttl = this.defaultTTL) {
//   const existing = this.store.get(key);

//   // Return cached value if valid
//   if (existing && !this._cleanupIfExpired(key, existing)) {
//     if (existing.value !== undefined) return existing.value;
//     if (existing.promise) return existing.promise;
//   }

//   // Create loader promise once and share it
//   const expiresAt = ttl > 0 ? this._now() + ttl : null;

//   const entry = {
//     value: undefined,
//     promise: null,
//     expiresAt,
//     timer: null,
//   };

//   if (expiresAt !== null) {
//     entry.timer = setTimeout(() => {
//       this._clearEntry(key, entry);
//     }, ttl);
//   }

//   const promise = (async () => {
//     try {
//       const result = await loader();
//       entry.value = result;
//       entry.promise = null;
//       return result;
//     } catch (err) {
//       // On failure: remove entry to allow retry
//       this._clearEntry(key, entry);
//       throw err;
//     }
//   })();

//   entry.promise = promise;
//   this.store.set(key, entry);

//   return promise;
// }


//   delete(key) {
//     const entry = this.store.get(key);
//     if (entry) {
//       this._clearEntry(key, entry);
//       return true;
//     }
//     return false;
//   }

//   clear() {
//     for (const [key, entry] of this.store.entries()) {
//       this._clearEntry(key, entry);
//     }
//   }

//   has(key) {
//     const entry = this.store.get(key);
//     if (!entry) return false;
//     return !this._cleanupIfExpired(key, entry);
//   }

//   get size() {
//     // Remove expired entries lazily
//     for (const [key, entry] of this.store.entries()) {
//       this._cleanupIfExpired(key, entry);
//     }
//     return this.store.size;
//   }

//   keys() {
//     for (const [key, entry] of this.store.entries()) {
//       this._cleanupIfExpired(key, entry);
//     }
//     return Array.from(this.store.keys());
//   }
// }

// module.exports = AsyncCache;

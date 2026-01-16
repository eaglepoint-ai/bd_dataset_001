const EventEmitter = require('events');

class TaskProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxConcurrent = options.maxConcurrent || 10;
    this.resultTTL = options.resultTTL || 60000;
    this.cacheSize = options.cacheSize || 1000;
    this.healthCheckInterval = options.healthCheckInterval || 30000;
    this.cleanupInterval = options.cleanupInterval || 60000;

    this.pending = new Map();
    this.processing = new Map();
    this.results = new Map();
    this.callbacks = new Map();
    this.cache = new Map();
    this.subscribers = [];
    this.externalSource = null;
    this.lastError = null;
    this.stats = {
      processed: 0,
      failed: 0,
      cached: 0
    };
    this.destroyed = false;

    this._startHealthCheck();
    this._startCleanup();
  }

  setExternalSource(source) {
    this.externalSource = source;
    source.on('task', (task) => this._handleExternalTask(task));
    source.on('error', (err) => this._handleSourceError(err));
    source.on('batch', (tasks) => this._handleBatch(tasks));
  }

  addTask(id, taskFn, options = {}) {
    if (this.destroyed) return Promise.reject(new Error('Processor destroyed'));

    const task = {
      id,
      fn: taskFn,
      priority: options.priority || 0,
      timeout: options.timeout || 30000,
      retries: options.retries || 0,
      attempt: 0,
      createdAt: Date.now(),
      metadata: options.metadata || {}
    };

    this.pending.set(id, task);
    this._processNext();

    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
    });
  }

  getResult(id) {
    if (this.results.has(id)) {
      return this.results.get(id);
    }
    return null;
  }

  getCached(key) {
    if (this.cache.has(key)) {
      this.stats.cached++;
      return this.cache.get(key);
    }
    return null;
  }

  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      const idx = this.subscribers.indexOf(callback);
      if (idx > -1) this.subscribers.splice(idx, 1);
    };
  }

  getStats() {
    return {
      ...this.stats,
      pending: this.pending.size,
      processing: this.processing.size,
      results: this.results.size,
      cached: this.cache.size
    };
  }

  destroy() {
    this.destroyed = true;
    this.pending.clear();
    this.processing.clear();
    this.removeAllListeners();
  }

  _startHealthCheck() {
    setInterval(() => {
      if (this.destroyed) return;

      const now = Date.now();
      for (const [id, task] of this.processing) {
        if (now - task.startedAt > task.timeout * 2) {
          this._failTask(id, new Error('Health check timeout'));
        }
      }

      this.emit('health', this.getStats());
    }, this.healthCheckInterval);
  }

  _startCleanup() {
    setInterval(() => {
      if (this.destroyed) return;

      const now = Date.now();
      for (const [id, result] of this.results) {
        if (now - result.completedAt > this.resultTTL) {
          this.results.delete(id);
        }
      }
    }, this.cleanupInterval);
  }

  async _processNext() {
    if (this.destroyed) return;
    if (this.processing.size >= this.maxConcurrent) return;

    const sorted = [...this.pending.entries()]
      .sort((a, b) => b[1].priority - a[1].priority);

    if (sorted.length === 0) return;

    const [id, task] = sorted[0];
    this.pending.delete(id);

    task.startedAt = Date.now();
    this.processing.set(id, task);

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), task.timeout);
      });

      const result = await Promise.race([task.fn(), timeoutPromise]);
      this._completeTask(id, result);
    } catch (error) {
      if (task.attempt < task.retries) {
        task.attempt++;
        this.pending.set(id, task);
        this._processNext();
      } else {
        this._failTask(id, error);
      }
    }

    this._processNext();
  }

  _completeTask(id, result) {
    const task = this.processing.get(id);
    this.processing.delete(id);

    this.results.set(id, {
      result,
      completedAt: Date.now(),
      duration: Date.now() - task.startedAt,
      task: task
    });

    this.stats.processed++;

    if (this.callbacks.has(id)) {
      this.callbacks.get(id).resolve(result);
    }

    this.subscribers.forEach(cb => cb({ type: 'complete', id, result }));
    this.emit('taskComplete', { id, result });
  }

  _failTask(id, error) {
    const task = this.processing.get(id);
    this.processing.delete(id);

    this.lastError = {
      error,
      task,
      allPending: [...this.pending.values()],
      allProcessing: [...this.processing.values()],
      timestamp: Date.now()
    };

    this.stats.failed++;

    if (this.callbacks.has(id)) {
      this.callbacks.get(id).reject(error);
    }

    this.subscribers.forEach(cb => cb({ type: 'fail', id, error }));
    this.emit('taskFail', { id, error });
  }

  _handleExternalTask(task) {
    this.addTask(task.id, task.fn, task.options);
  }

  _handleSourceError(err) {
    this.lastError = {
      error: err,
      timestamp: Date.now()
    };
    this.emit('sourceError', err);
  }

  _handleBatch(tasks) {
    tasks.forEach(task => this._handleExternalTask(task));
  }
}

module.exports = TaskProcessor;

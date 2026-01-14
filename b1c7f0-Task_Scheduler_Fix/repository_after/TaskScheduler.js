const EventEmitter = require('events');

/**
 * @typedef {Object} TaskSchedulerOptions
 * @property {number} [maxConcurrent=3]
 * @property {number} [defaultRetries=2]
 * @property {number} [defaultTimeout=5000]
 * @property {number} [baseDelay=100] Base delay for exponential backoff (ms)
 * @property {number} [maxDelay=5000] Max delay for exponential backoff (ms)
 */

/**
 * @typedef {Object} TaskInput
 * @property {string} id
 * @property {(signal?: AbortSignal) => Promise<any>} fn
 * @property {number} [priority=0]
 * @property {string[]} [dependencies=[]]
 * @property {number} [retries]
 * @property {number} [timeout]
 * @property {boolean} [force=false] Force re-run even if cached result exists
 */

/**
 * @typedef {Object} TaskStatus
 * @property {string} id
 * @property {'pending'|'running'|'completed'|'failed'|'cancelled'|'retrying'} status
 * @property {number} attempts
 * @property {any} result
 * @property {any} error
 */

/**
 * TaskScheduler processes async tasks with dependencies, retries, priorities and cancellation.
 *
 * Events emitted:
 * - taskStart(taskId)
 * - taskComplete(taskId, result)
 * - taskFail(taskId, error)
 * - taskRetry(taskId, attempt, delayMs)
 * - taskCancel(taskId)
 */
class TaskScheduler extends EventEmitter {
  /**
   * @param {TaskSchedulerOptions} [options]
   */
  constructor(options = {}) {
    super();
    this.tasks = [];
    this.running = {};
    this.completed = {};
    this.failed = {};
    this.maxConcurrent = options.maxConcurrent || 3;
    this.defaultRetries = options.defaultRetries || 2;
    this.defaultTimeout = options.defaultTimeout || 5000;
    this.baseDelay = options.baseDelay || 100;
    this.maxDelay = options.maxDelay || 5000;
    this.runningCount = 0; // Atomic counter for concurrency control
    this.timeouts = new Map(); // Store timeout IDs for cleanup
    this.abortControllers = new Map(); // Store AbortControllers for cancel
    this.isPaused = false;
    this.isShuttingDown = false;
  }

  /**
   * Add a task to the scheduler.
   * Public API: must remain stable.
   *
   * @param {TaskInput} task
   * @returns {this}
   */
  addTask(task) {
    // result caching unless force is provided
    if (!task.force && this.completed[task.id] !== undefined) {
      return this;
    }
    if (this.isShuttingDown) {
      throw new Error('Scheduler is shutting down, no new tasks accepted');
    }
    this.tasks.push({
      id: task.id,
      fn: task.fn,
      priority: task.priority || 0,
      dependencies: task.dependencies || [],
      retries: task.retries ?? this.defaultRetries,
      timeout: task.timeout ?? this.defaultTimeout,
      status: 'pending',
      attempts: 0,
      result: null,
      error: null,
      force: task.force || false,
    });
    return this;
  }

  // Cycle detection using DFS
  _detectCycles() {
    const visited = new Set();
    const recursionStack = new Set();
    const cyclePath = [];
    
    const hasCycleDFS = (taskId) => {
      if (recursionStack.has(taskId)) {
        // Found a cycle, build the path
        const cycleStart = cyclePath.indexOf(taskId);
        if (cycleStart !== -1) {
          const path = cyclePath.slice(cycleStart).concat(taskId);
          return path;
        }
        return [taskId];
      }
      
      if (visited.has(taskId)) {
        return null;
      }
      
      visited.add(taskId);
      recursionStack.add(taskId);
      cyclePath.push(taskId);
      
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        for (const dep of task.dependencies) {
          const cycle = hasCycleDFS(dep);
          if (cycle) {
            return cycle;
          }
        }
      }
      
      recursionStack.delete(taskId);
      cyclePath.pop();
      return null;
    };
    
    for (const task of this.tasks) {
      if (!visited.has(task.id)) {
        const cycle = hasCycleDFS(task.id);
        if (cycle) {
          const path = cycle.join(' → ');
          throw new Error(`Circular dependency detected: ${path}`);
        }
      }
    }
  }
  
  // Recursive dependency failure propagation
  _propagateFailure(taskId, error) {
    const dependents = this.tasks.filter(t => 
      t.dependencies.includes(taskId) && t.status === 'pending'
    );
    
    for (const dependent of dependents) {
      dependent.status = 'failed';
      dependent.error = new Error(`Dependency ${taskId} failed`);
      this.failed[dependent.id] = dependent.error;
      // Recursively propagate to dependents of dependents
      this._propagateFailure(dependent.id, dependent.error);
    }
  }

  /**
   * Run scheduled tasks.
   * Public API: must remain stable.
   *
   * @returns {Promise<Record<string, {success: boolean, result?: any, error?: any}>>}
   */
  async run() {
    // 1. Detect cycles before running
    this._detectCycles();
    
    const results = {};
    
    while (this.tasks.some(t => t.status === 'pending' || t.status === 'retrying')) {
      // Pause handling: wait until resumed
      while (this.isPaused) {
        await new Promise(r => setTimeout(r, 50));
      }

      const available = this.tasks.filter(t => {
        if (t.status !== 'pending' && t.status !== 'retrying') return false;
        // Only process pending tasks, not retrying ones (they'll become pending after delay)
        if (t.status === 'retrying') return false;
      
        // Check for failed dependencies (recursive propagation handled in catch)
        for (const dep of t.dependencies) {
          if (this.failed[dep]) {
            t.status = 'failed';
            t.error = new Error(`Dependency ${dep} failed`);
            this.failed[t.id] = t.error;
            this._propagateFailure(t.id, t.error);
            return false;
          }
        }
      
        // Check if all dependencies are completed
        return t.dependencies.every(dep => this.completed[dep]);
      });
      
      // Use a simple max-heap for priority selection
      const heap = new MaxHeap();
      for (const task of available) heap.push(task);

      // Use atomic counter instead of Object.keys for async-safe concurrency
      const availableSlots = this.maxConcurrent - this.runningCount;
      const toRun = [];
      for (let i = 0; i < Math.max(0, availableSlots); i++) {
        const top = heap.pop();
        if (!top) break;
        toRun.push(top);
      }
      
      for (const task of toRun) {
        task.status = 'running';
        this.running[task.id] = task;
        this.runningCount++; // Atomic increment
        
        // Create AbortController for this task
        const abortController = new AbortController();
        this.abortControllers.set(task.id, abortController);
        
        this.emit('taskStart', task.id);

        this.executeTask(task, abortController.signal).then(result => {
          task.status = 'completed';
          task.result = result;
          this.completed[task.id] = result;
          delete this.running[task.id];
          this.runningCount--; // Atomic decrement
          this.abortControllers.delete(task.id);
          this.emit('taskComplete', task.id, result);
          results[task.id] = { success: true, result };
        }).catch(error => {
          delete this.running[task.id];
          this.runningCount--; // Atomic decrement
          this.abortControllers.delete(task.id);
          
          if (task.attempts < task.retries) {
            // Exponential backoff retry
            const delay = Math.min(
              this.baseDelay * Math.pow(2, task.attempts),
              this.maxDelay
            );
            
            // Mark as retrying to prevent immediate pickup, then schedule retry
            task.status = 'retrying';
            task.attempts++;
            this.emit('taskRetry', task.id, task.attempts, delay);
            
            // Schedule retry with delay
            const retryTimeoutId = setTimeout(() => {
              task.status = 'pending';
              this.timeouts.delete(`retry_${task.id}`);
            }, delay);
            
            // Store retry timeout for potential cleanup
            this.timeouts.set(`retry_${task.id}`, retryTimeoutId);
          } else {
            task.status = 'failed';
            task.error = error;
            this.failed[task.id] = error;
            // Propagate failure to dependents
            this._propagateFailure(task.id, error);
            this.emit('taskFail', task.id, error);
            results[task.id] = { success: false, error };
          }
        });
      }
      
      await new Promise(r => setTimeout(r, 100));
    }
    
    return results;
  }

  /**
   * Execute a single task with timeout and optional AbortSignal.
   *
   * @param {any} task
   * @param {AbortSignal} [signal]
   * @returns {Promise<any>}
   */
  async executeTask(task, signal) {
    // Check if already aborted
    if (signal && signal.aborted) {
      throw new Error('Task aborted');
    }
    
    let timeoutId;
    
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Timeout'));
      }, task.timeout);
      // Store timeout ID for cleanup
      this.timeouts.set(task.id, timeoutId);
    });
    
    // Listen for abort signal
    let abortHandler;
    if (signal) {
      abortHandler = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          this.timeouts.delete(task.id);
        }
      };
      signal.addEventListener('abort', abortHandler);
    }
    
    try {
      // Check if task function accepts AbortSignal
      let taskPromise;
      if (signal && task.fn.length > 0) {
        // Function has parameters, try passing signal
        try {
          taskPromise = task.fn(signal);
        } catch (e) {
          // If function doesn't accept signal, call without it
          taskPromise = task.fn();
        }
      } else {
        taskPromise = task.fn();
      }
      
      const result = await Promise.race([taskPromise, timeoutPromise]);
      
      // Clear timeout if task completed
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.timeouts.delete(task.id);
      }
      
      // Remove abort listener
      if (signal && abortHandler) {
        signal.removeEventListener('abort', abortHandler);
      }
      
      return result;
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.timeouts.delete(task.id);
      }
      
      // Remove abort listener
      if (signal && abortHandler) {
        signal.removeEventListener('abort', abortHandler);
      }
      
      // Check if error was due to abort
      if (signal && signal.aborted) {
        throw new Error('Task aborted');
      }
      
      throw error;
    }
  }

  /**
   * Cancel a pending or running task.
   * Public API: must remain stable.
   *
   * @param {string} taskId
   * @returns {boolean}
   */
  cancel(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return false;
    
    // Cancel pending task
    if (task.status === 'pending') {
      task.status = 'cancelled';
      this.emit('taskCancel', taskId);
      return true;
    }
    
    // Cancel running task using AbortController
    if (task.status === 'running') {
      const abortController = this.abortControllers.get(taskId);
      if (abortController) {
        abortController.abort();
        task.status = 'cancelled';
        delete this.running[task.id];
        this.runningCount--;
        this.abortControllers.delete(taskId);
        this.emit('taskCancel', taskId);
        
        // Clear timeout if exists
        const timeoutId = this.timeouts.get(taskId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          this.timeouts.delete(taskId);
        }
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get status of a task.
   * Public API: must remain stable.
   *
   * @param {string} taskId
   * @returns {TaskStatus|null}
   */
  getStatus(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    return task ? {
      id: task.id,
      status: task.status,
      attempts: task.attempts,
      result: task.result,
      error: task.error
    } : null;
  }

  /** Pause starting new tasks (running tasks may finish). */
  pause() {
    this.isPaused = true;
  }

  /** Resume processing after pause(). */
  resume() {
    this.isPaused = false;
  }

  /**
   * Graceful shutdown: wait for running tasks, mark pending/retrying as failed, prevent new tasks.
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.isShuttingDown = true;
    // wait for running tasks to finish
    while (this.runningCount > 0) {
      await new Promise(r => setTimeout(r, 50));
    }
    // reject pending tasks
    this.tasks.forEach(t => {
      if (t.status === 'pending' || t.status === 'retrying') {
        t.status = 'failed';
        t.error = new Error('Scheduler shutdown');
        this.failed[t.id] = t.error;
      }
    });
  }
}

module.exports = TaskScheduler;

// Simple max-heap for priority queue
class MaxHeap {
  constructor() {
    this.data = [];
  }
  push(item) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }
  pop() {
    if (this.data.length === 0) return null;
    const max = this.data[0];
    const end = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = end;
      this._sinkDown(0);
    }
    return max;
  }
  _bubbleUp(n) {
    const element = this.data[n];
    while (n > 0) {
      const parentN = Math.floor((n - 1) / 2);
      const parent = this.data[parentN];
      if (element.priority <= parent.priority) break;
      this.data[parentN] = element;
      this.data[n] = parent;
      n = parentN;
    }
  }
  _sinkDown(n) {
    const length = this.data.length;
    const element = this.data[n];
    while (true) {
      let swap = null;
      const leftN = 2 * n + 1;
      const rightN = 2 * n + 2;
      if (leftN < length) {
        const left = this.data[leftN];
        if (left.priority > element.priority) swap = leftN;
      }
      if (rightN < length) {
        const right = this.data[rightN];
        if (
          (swap === null && right.priority > element.priority) ||
          (swap !== null && right.priority > this.data[swap].priority)
        ) {
          swap = rightN;
        }
      }
      if (swap === null) break;
      this.data[n] = this.data[swap];
      this.data[swap] = element;
      n = swap;
    }
  }
}

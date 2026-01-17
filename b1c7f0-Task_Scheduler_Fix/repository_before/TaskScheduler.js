class TaskScheduler {
  constructor(options = {}) {
    this.tasks = [];
    this.running = {};
    this.completed = {};
    this.failed = {};
    this.maxConcurrent = options.maxConcurrent || 3;
    this.defaultRetries = options.defaultRetries || 2;
    this.defaultTimeout = options.defaultTimeout || 5000;
  }

  addTask(task) {
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
      error: null
    });
    return this;
  }

  async run() {
    const results = {};
    
    while (this.tasks.some(t => t.status === 'pending')) {
      const available = this.tasks.filter(t => 
        t.status === 'pending' && 
        t.dependencies.every(dep => this.completed[dep])
      );
      
      available.sort((a, b) => b.priority - a.priority);
      
      const toRun = available.slice(0, this.maxConcurrent - Object.keys(this.running).length);
      
      for (const task of toRun) {
        task.status = 'running';
        this.running[task.id] = task;
        
        this.executeTask(task).then(result => {
          task.status = 'completed';
          task.result = result;
          this.completed[task.id] = result;
          delete this.running[task.id];
          results[task.id] = { success: true, result };
        }).catch(error => {
          if (task.attempts < task.retries) {
            task.status = 'pending';
            task.attempts++;
          } else {
            task.status = 'failed';
            task.error = error;
            this.failed[task.id] = error;
            results[task.id] = { success: false, error };
          }
          delete this.running[task.id];
        });
      }
      
      await new Promise(r => setTimeout(r, 100));
    }
    
    return results;
  }

  async executeTask(task) {
    return Promise.race([
      task.fn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), task.timeout)
      )
    ]);
  }

  cancel(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.status === 'pending') {
      task.status = 'cancelled';
      return true;
    }
    return false;
  }

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
}

module.exports = TaskScheduler;


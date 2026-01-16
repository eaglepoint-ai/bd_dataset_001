package main

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
)

// Define sentinel errors for API consumers.
var (
	ErrPoolClosed = errors.New("worker pool is closed")
	ErrNoWorkers  = errors.New("worker pool has no workers")
	ErrNilTask    = errors.New("task cannot be nil")
)

type Task func() error

type WorkerPool struct {
	workers int

	// taskQueue: Buffered slightly to improve throughput and reduce
	// context switching between submitter/worker, though not strictly required.
	taskQueue chan Task

	// quit: A broadcast channel to signal all submitters that the pool is stopping.
	// This prevents the "send on closed channel" panic.
	quit chan struct{}

	// results: Protected by RWMutex for thread-safe access.
	resultsMu sync.RWMutex
	results   map[int]error

	// taskCounter: Ensures every task gets a unique ID in the result map
	// preventing data overwrite.
	taskCounter int32

	// stopOnce: Ensures Stop() logic executes exactly once, preventing
	// "close of closed channel" panics.
	stopOnce sync.Once

	wg sync.WaitGroup
}

func NewWorkerPool(workers int) *WorkerPool {
	// Defensive check for negative workers, though 0 is handled in Start/Submit
	if workers < 0 {
		workers = 0
	}

	return &WorkerPool{
		workers: workers,
		// Buffer size optimization: Equal to worker count ensures
		// workers always have one task ready, minimizing lag.
		taskQueue: make(chan Task, workers),
		quit:      make(chan struct{}),
		results:   make(map[int]error),
	}
}

func (wp *WorkerPool) Start(ctx context.Context) {
	if wp.workers == 0 {
		return
	}

	for i := 0; i < wp.workers; i++ {
		wp.wg.Add(1)
		go wp.worker(ctx)
	}
}

func (wp *WorkerPool) worker(ctx context.Context) {
	defer wp.wg.Done()

	for {
		select {
		// Priority 1: Context cancellation (e.g., timeout)
		// Must be checked to prevent goroutine leaks.
		case <-ctx.Done():
			return

		// Priority 2: Task processing
		case task, ok := <-wp.taskQueue:
			if !ok {
				// Channel closed by Stop(), drain complete.
				return
			}

			// Execute task
			err := task()

			// Save result safely
			wp.saveResult(err)
		}
	}
}

func (wp *WorkerPool) saveResult(err error) {
	// Atomic increment ensures every task gets a unique key.
	// The original code used workerID, which caused massive data loss.
	id := int(atomic.AddInt32(&wp.taskCounter, 1))

	wp.resultsMu.Lock()
	wp.results[id] = err
	defer wp.resultsMu.Unlock()
}

func (wp *WorkerPool) Submit(task Task) error {
	if task == nil {
		return ErrNilTask
	}
	if wp.workers == 0 {
		return ErrNoWorkers
	}

	// 1. Check if pool is already stopped to avoid blocking
	select {
	case <-wp.quit:
		return ErrPoolClosed
	default:
	}

	// 2. Try to submit.
	// We use select to handle the race condition where Stop() is called
	// while Submit is blocked waiting for a worker.
	select {
	case wp.taskQueue <- task:
		return nil
	case <-wp.quit:
		// Stop() was called while we were waiting.
		// Return error gracefully instead of panicking.
		return ErrPoolClosed
	}
}

func (wp *WorkerPool) Stop() {
	// Ensure idempotent behavior (safe to call multiple times)
	wp.stopOnce.Do(func() {
		// 1. Close quit channel first.
		// This signals Submit() to stop accepting work immediately.
		close(wp.quit)

		// 2. Close taskQueue.
		// This signals workers to finish current tasks, drain buffer, and exit.
		close(wp.taskQueue)
	})

	// 3. Wait for all workers to finish.
	wp.wg.Wait()
}

func (wp *WorkerPool) GetResults() map[int]error {
	wp.resultsMu.RLock()
	defer wp.resultsMu.RUnlock()

	// Return a copy to prevent data races if the caller iterates
	// over the map while workers are still writing to it.
	copyResults := make(map[int]error, len(wp.results))
	for k, v := range wp.results {
		copyResults[k] = v
	}

	return copyResults
}

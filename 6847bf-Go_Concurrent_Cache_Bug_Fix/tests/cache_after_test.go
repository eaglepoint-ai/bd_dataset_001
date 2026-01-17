//go:build after

package cache_test

import (
	"context"
	"fmt"
	"runtime"
	"sync"
	"testing"
	"time"

	after "cacheapp/repository_after"
)

type Cache interface {
	Get(ctx context.Context, key string) (interface{}, bool)
	Set(key string, value interface{})
	Delete(key string)
	Stop()
	Count() int
}

func newCache(ttl time.Duration, cleanupInterval time.Duration) Cache {
	return after.NewCache(ttl, cleanupInterval)
}

func TestBasicOperations(t *testing.T) {
	cache := newCache(1*time.Second, 100*time.Millisecond)
	defer cache.Stop()

	// Test Set and Get
	cache.Set("key1", "value1")
	val, found := cache.Get(context.Background(), "key1")
	if !found || val != "value1" {
		t.Errorf("Expected value1, got %v, found %v", val, found)
	}

	// Test Delete
	cache.Delete("key1")
	_, found = cache.Get(context.Background(), "key1")
	if found {
		t.Error("Expected key to be deleted")
	}

	// Test Count
	cache.Set("key2", "value2")
	if cache.Count() != 1 {
		t.Errorf("Expected count 1, got %d", cache.Count())
	}
}

func TestExpiration(t *testing.T) {
	cache := newCache(100*time.Millisecond, 50*time.Millisecond)
	defer cache.Stop()

	cache.Set("key", "value")
	time.Sleep(150 * time.Millisecond)
	_, found := cache.Get(context.Background(), "key")
	if found {
		t.Error("Expected key to be expired")
	}
}

func TestGoroutineLeak(t *testing.T) {
	initialGoroutines := runtime.NumGoroutine()
	cache := newCache(1*time.Second, 100*time.Millisecond)
	time.Sleep(200 * time.Millisecond) // Let cleanup run
	cache.Stop()
	time.Sleep(100 * time.Millisecond) // Wait for cleanup to exit
	finalGoroutines := runtime.NumGoroutine()
	if finalGoroutines > initialGoroutines {
		t.Errorf("Goroutine leak: initial %d, final %d", initialGoroutines, finalGoroutines)
	}
}

func TestContextCancellation(t *testing.T) {
	cache := newCache(1*time.Second, 100*time.Millisecond)
	defer cache.Stop()

	cache.Set("key", "value")
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, found := cache.Get(ctx, "key")
	if found {
		t.Error("Expected Get to return false on cancelled context")
	}
}

func TestStop(t *testing.T) {
	cache := newCache(1*time.Second, 100*time.Millisecond)
	cache.Stop()
	// After stop, operations should still work or gracefully fail, but no panic
	cache.Set("key", "value")
	_, found := cache.Get(context.Background(), "key")
	// Depending on implementation, but no panic
	_ = found
}

func TestTTLReset(t *testing.T) {
	cache := newCache(200*time.Millisecond, 50*time.Millisecond)
	defer cache.Stop()

	cache.Set("key", "value1")
	time.Sleep(100 * time.Millisecond)
	cache.Set("key", "value2") // Should reset TTL
	time.Sleep(150 * time.Millisecond)
	val, found := cache.Get(context.Background(), "key")
	if !found || val != "value2" {
		t.Errorf("TTL not reset: expected value2, got %v, found %v", val, found)
	}
}

func TestNoPanic(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("Panic occurred: %v", r)
		}
	}()
	cache := newCache(1*time.Second, 100*time.Millisecond)
	cache.Stop()
	cache.Stop() // Double stop
	cache.Set("key", "value")
	cache.Get(context.Background(), "key")
	cache.Delete("key")
}

func TestConcurrency(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Errorf("Panic occurred: %v", r)
		}
	}()
	cache := newCache(1*time.Second, 100*time.Millisecond)
	defer cache.Stop()

	var wg sync.WaitGroup
	numGoroutines := 10
	opsPerGoroutine := 100

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer func() {
				if r := recover(); r != nil {
					t.Errorf("Panic in goroutine %d: %v", id, r)
				}
			}()
			defer wg.Done()
			for j := 0; j < opsPerGoroutine; j++ {
				key := fmt.Sprintf("key%d-%d", id, j)
				cache.Set(key, j)
				val, found := cache.Get(context.Background(), key)
				if found && val != j {
					t.Errorf("Race condition: expected %d, got %v", j, val)
				}
			}
		}(i)
	}
	wg.Wait()
}

// Package cache provides a concurrent TTL-based cache implementation.
// Fixed issues from before version:
// - Race conditions on map access with mutex synchronization
// - Goroutine leaks by listening to done channel in cleanup
// - Channel deadlocks using select with default
// - Context cancellation in Get operation
// - Improper Stop method with sync.Once and waiting for cleanup
// - TTL reset on Set updates
// - Panic prevention on double closes
package cache

import (
	"context"
	"sync"
	"time"
)

type item struct {
	value      interface{}
	expiration time.Time
}

type Cache struct {
	items       map[string]*item
	mu          sync.Mutex
	done        chan struct{}
	cleanupDone chan struct{}
	ttl         time.Duration
	stopOnce    sync.Once // Added to prevent double close panics
}

func NewCache(ttl time.Duration, cleanupInterval time.Duration) *Cache {
	c := &Cache{
		items:       make(map[string]*item),
		done:        make(chan struct{}),
		cleanupDone: make(chan struct{}),
		ttl:         ttl,
	}
	go c.startCleanup(cleanupInterval)
	return c
}

func (c *Cache) startCleanup(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			c.deleteExpired()
		case <-c.done: // Fixed: Listen to done channel to exit goroutine and prevent leaks
			close(c.cleanupDone)
			return
		}
	}
}

func (c *Cache) deleteExpired() {
	c.mu.Lock() // Fixed: Protect map access with mutex
	defer c.mu.Unlock()
	now := time.Now()
	for key, item := range c.items {
		if now.After(item.expiration) {
			delete(c.items, key)
		}
	}
}

func (c *Cache) Get(ctx context.Context, key string) (interface{}, bool) {
	c.mu.Lock() // Fixed: Protect map read with mutex
	item, found := c.items[key]
	c.mu.Unlock()

	if !found {
		return nil, false
	}

	select {
	case <-ctx.Done(): // Fixed: Respect context cancellation
		return nil, false
	default:
	}

	if time.Now().After(item.expiration) {
		c.Delete(key)
		return nil, false
	}

	return item.value, true
}

func (c *Cache) Set(key string, value interface{}) {
	c.mu.Lock() // Fixed: Protect map write with mutex; TTL resets automatically on update
	defer c.mu.Unlock()
	item := &item{
		value:      value,
		expiration: time.Now().Add(c.ttl),
	}
	c.items[key] = item
}

func (c *Cache) Delete(key string) {
	c.mu.Lock() // Fixed: Protect map write with mutex
	defer c.mu.Unlock()
	delete(c.items, key)
}

func (c *Cache) Stop() {
	c.stopOnce.Do(func() { // Fixed: Prevent double close panics
		close(c.done)
		<-c.cleanupDone // Fixed: Wait for cleanup goroutine to exit
	})
}

func (c *Cache) Count() int {
	c.mu.Lock() // Fixed: Protect map read with mutex
	defer c.mu.Unlock()
	return len(c.items)
}

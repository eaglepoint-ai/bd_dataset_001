package main

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
	for {
		<-ticker.C
		c.deleteExpired()
	}
}

func (c *Cache) deleteExpired() {
	now := time.Now()
	for key, item := range c.items {
		if now.After(item.expiration) {
			delete(c.items, key)
		}
	}
}

func (c *Cache) Get(ctx context.Context, key string) (interface{}, bool) {
	c.mu.Lock()
	item, found := c.items[key]
	c.mu.Unlock()

	if !found {
		return nil, false
	}

	if time.Now().After(item.expiration) {
		c.Delete(key)
		return nil, false
	}

	return item.value, true
}

func (c *Cache) Set(key string, value interface{}) {
	item := &item{
		value:      value,
		expiration: time.Now().Add(c.ttl),
	}
	c.items[key] = item
}

func (c *Cache) Delete(key string) {
	c.mu.Lock()
	delete(c.items, key)
	c.mu.Unlock()
}

func (c *Cache) Stop() {
	close(c.done)
	close(c.cleanupDone)
}

func (c *Cache) Count() int {
	return len(c.items)
}

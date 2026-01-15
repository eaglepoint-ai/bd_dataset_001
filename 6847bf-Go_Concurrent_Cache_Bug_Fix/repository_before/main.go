package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	c := NewCache(time.Second*5, time.Second)
	c.Set("key", "value")
	
	val, found := c.Get(context.Background(), "key")
	if found {
		fmt.Printf("Found: %v\n", val)
	}
	
	fmt.Println("Cache initialized successfully")
}

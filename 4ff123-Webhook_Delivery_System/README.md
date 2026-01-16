# Webhook Delivery System

## Problem Statement

You are a backend engineer at a payment processing company. The platform needs to notify merchant systems when payment events occur (successful charges, refunds, disputes). Merchants configure webhook endpoints to receive these notifications. Delivery must be reliable even when merchant servers are temporarily unavailable.

## Category

**New Feature Development** (Node.js)

## Prompt

Webhook Delivery System

Context:
You are a backend engineer at a payment processing company. The platform needs to notify merchant systems when payment events occur (successful charges, refunds, disputes). Merchants configure webhook endpoints to receive these notifications. Delivery must be reliable even when merchant servers are temporarily unavailable.

Business Requirement:
Build a webhook delivery service that guarantees event delivery to registered endpoints with automatic retry on failure and proper failure handling.

Language and Environment:
- Language: Node.js (version 18+)
- Module format: ES modules or CommonJS
- You may use built-in Node.js modules (http, https, crypto, events, etc.)
- No external message queues or databases (in-memory storage only)
- No third-party retry or queue libraries

Required Deliverables:
1. Main service file with the webhook delivery implementation
2. Package.json with project configuration
3. Working code that can be imported and used programmatically

Required Interface:
- registerEndpoint(url, secret) → returns endpointId (string)
- submitEvent(endpointId, eventType, payload) → returns eventId (string)
- getEventStatus(eventId) → returns { status, attempts, lastError, deliveredAt }
- getDeadLetterEvents(endpointId) → returns array of failed events
- shutdown() → returns Promise that resolves when all in-flight deliveries complete

Requirements:

1. Endpoint registration stores URL and secret key for HMAC signing
2. Event submission queues delivery to the registered endpoint
3. HTTP POST delivery includes:
   - Content-Type: application/json header
   - X-Signature header with HMAC-SHA256 hex digest of payload using endpoint secret
   - X-Event-Type header with event type
   - X-Event-Id header with event ID
   - JSON payload in body
4. Retry failed deliveries with exponential backoff delays
5. Maximum 5 retry attempts per event
6. Move events to dead letter store after max attempts exceeded
7. Individual delivery timeout: 30 seconds
8. Preserve event ordering per endpoint (event A submitted before B must deliver in that order)
9. Events to different endpoints may deliver in parallel
10. Handle graceful shutdown: complete in-flight deliveries, reject new submissions

Validation Scenarios:
1. Endpoint returns 200 → event marked delivered, no retry
2. Endpoint returns 500 → event retried with backoff, up to max attempts
3. Endpoint returns 4xx (client error) → event marked failed immediately, no retry
4. Endpoint times out (>30s) → treated as retriable failure
5. Network error (connection refused) → treated as retriable failure
6. Max attempts exceeded → event moved to dead letter store
7. Three events to same endpoint → delivered in submission order
8. Shutdown called → in-flight deliveries complete, new submits throw error

Constraints:
- Memory usage must not grow unbounded with pending events
- Must handle 1000+ concurrent pending deliveries
- All async operations must be properly handled (no unhandled rejections)


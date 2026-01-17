Promo Code Service Performance Fix

Context:
You are a backend engineer at an e-commerce company. The promo code validation 
service is experiencing severe performance degradation during flash sales and 
promotional campaigns. The DevOps team has flagged this service as a critical 
bottleneck affecting checkout completion rates.

Business Requirement:
Optimize the promo code service to handle high traffic loads without degrading 
user experience or causing order failures.

Language and Environment:
- Language: Node.js (JavaScript)
- Database: MongoDB 4.4+
- Current load: 50 requests/second during normal operations
- Peak load: 2000 requests/second during flash sales
- SLA requirement: 95th percentile response time under 100ms

Reported Symptoms:
- Promo code validation takes 800-1200ms during flash sales (SLA target: 100ms)
- MongoDB connection pool exhaustion errors during peak traffic
- Memory usage grows continuously, requiring service restart every 4-6 hours
- Database CPU spikes to 90%+ when popular promo codes are used
- Customers report "promo code already used" errors, but code still has remaining uses
- Same promo code occasionally gets applied twice when users double-click submit button

Monitoring Data:
- Average database queries per validation: 3-4 round trips
- Collection sizes: promo_codes (50,000 documents), promo_usage (2,000,000 documents)
- No indexes exist except default _id index
- Application memory grows approximately 50MB per hour under sustained load

Constraints:
- Must maintain backward compatibility with existing API contract
- Cannot modify the database schema (no new collections)
- Solution must work with existing MongoDB deployment only (no Redis or external cache services)
- Must handle concurrent requests without data inconsistency

Validation Scenarios:
1. Validate 1000 concurrent requests for same promo code in under 5 seconds total
2. Single validation completes in under 100ms at 95th percentile
3. Memory usage remains stable over 8-hour sustained load test
4. Two simultaneous requests for last available use - exactly one succeeds
5. Service handles 2000 requests/second without connection pool exhaustion
6. Database CPU remains under 50% during peak traffic
7. Promo code with 1 remaining use cannot be applied twice under any circumstances

Developer Notes:
If unfamiliar with MongoDB performance optimization:
- MongoDB Indexing: https://www.mongodb.com/docs/manual/indexes/
- MongoDB Aggregation: https://www.mongodb.com/docs/manual/aggregation/
- MongoDB Transactions: https://www.mongodb.com/docs/manual/core/transactions/
- Use AI assistance to understand connection pooling and atomic operations


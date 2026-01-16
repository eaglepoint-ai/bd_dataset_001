Order Service Reliability Crisis

Problem Statement:
The order management service at an e-commerce company is experiencing multiple production incidents. Customer support is overwhelmed with complaints about slow pages, incorrect charges, and system errors. The engineering team must fix the OrderService class to resolve these issues without changing the database schema or adding new dependencies.

Context:
You are a backend engineer at an e-commerce company. The order management service handles customer orders, inventory tracking, and generates reports for the admin dashboard. Operations has escalated multiple production incidents affecting customer experience and business metrics.

Business Impact:

- Customer complaints about slow order pages
- Finance reports incorrect stock values after flash sales
- Customers charged for products that were out of stock
- Admin dashboard crashes when viewing order history
- Database connection pool exhausted during peak hours

Environment:

- Language: Node.js 18+
- Database: MySQL with mysql2/promise driver
- Connection: Pool-based (pool already configured and passed to service)
- No schema changes allowed (locked by DBA team)
- No new npm dependencies allowed (security policy)
- Response time requirement: under 200ms for all endpoints

Reported Symptoms from Production Logs:

1. Order detail pages take 8-15 seconds for users with many orders
2. Search endpoint intermittently returns "unexpected database error"
3. Flash sale events show 47 successful orders for products with 50 stock, but inventory shows -3
4. Payment failures leave partial orders in database with stock already decremented
5. "Too many connections" warnings appear in logs during morning peak (9-10 AM)
6. Admin export crashes browser when clicking "View All Orders" (50,000+ records)

Constraints:

- Cannot modify database schema
- Cannot add npm packages
- Must maintain existing method signatures
- Service receives pool via constructor (do not create new pools)
- All endpoints must respond in under 200ms

Requirements:

1. Fix the OrderService class in repository_before/order.service.js
2. All existing method signatures must be preserved
3. Service must handle the validation scenarios listed below
4. Code must work with Node.js 18+ and mysql2/promise
5. No external dependencies beyond mysql2

Validation Scenarios:

1. User with 50 orders and 10 items each loads order page in under 200ms
2. Search with any sortBy value returns results without database error
3. Payment failure for order with 3 items results in zero stock changes and zero order records
4. 100 concurrent users attempt to buy last 50 items - exactly 50 orders succeed, stock equals zero
5. Generate 500 reports sequentially without connection pool warnings
6. Admin views 50,000 orders without browser crash or timeout

Starter Code:
The OrderService class exists in repository_before/order.service.js and contains the issues causing the production incidents.

---

Commands

Run with Docker (all in one):
docker run --rm $(docker build -q .)

---

Developer Notes:
If you are unfamiliar with Node.js database operations:

- MySQL2 documentation: https://github.com/sidorares/node-mysql2
- Node.js MySQL best practices: https://planetscale.com/blog/how-to-use-mysql-with-nodejs
- Use AI assistance to understand connection pooling, transactions, and parameterized queries

## Commands

### Repository Before

```bash
docker compose run --rm -e TEST_TARGET="../repository_before/order.service.js" app node tests/test-suite.js
```

### Repository After

```bash
docker compose run --rm -e TEST_TARGET="../repository_after/order.service.js" app node tests/test-suite.js
```

### Evaluation

```bash
docker compose run --rm app node evaluation/evaluation.js
```

## Generate patch

```bash
git diff --no-index repository_before repository_after > patches/task_001.patch
```

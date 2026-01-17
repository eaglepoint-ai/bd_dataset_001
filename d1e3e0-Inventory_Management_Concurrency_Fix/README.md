# Inventory Management Concurrency Fix

## Problem Statement

An inventory management service built with NestJS and TypeORM is experiencing data inconsistency issues in production. Users report that concurrent stock adjustments sometimes result in incorrect quantities, and the audit trail (transactions) occasionally shows mismatched data. The service also has performance issues when the product catalog grows. Fix all transaction handling, concurrency bugs, and query performance issues while maintaining the same public API.

---

## Prompt

**Role:** Senior Backend Engineer

**Context:** Your company's inventory management system has critical bugs causing data loss. Two warehouse workers adjusting the same product simultaneously sometimes results in lost updates. The audit log occasionally references users that don't exist in the transaction context. Performance degrades as the catalog grows.

**Scale Assumptions:**

- 50,000+ products
- 100+ concurrent users
- 10,000 adjustments/day

---

## Core Requirements (Must Fix)

### 1. Race Condition - Missing Pessimistic Lock
- Concurrent adjustments can read stale quantity
- Add SELECT FOR UPDATE lock on product read

### 2. Transaction Context Leak
- User lookup happens outside transaction context
- Move all DB operations inside queryRunner.manager

### 3. Pagination for findAll
- Currently returns all products (memory issue)
- Add limit/offset pagination

### 4. Eager Loading for Relations
- N+1 query when accessing product.transactions
- Add proper relation loading where needed

---

## Constraints

- Do NOT change public API method signatures
- Do NOT change entity structures
- Must use TypeORM QueryRunner for transactions
- Must maintain audit trail integrity

---

## Acceptance Criteria

1. Two concurrent adjustments to same product produce correct final quantity
2. Transaction records always reference valid user within same transaction
3. findAll with 50k products returns paginated results under 100ms
4. No N+1 queries when loading product with transactions

---

## Requirements Summary

1. **Pessimistic lock** - Use FOR UPDATE when reading product in adjust()
2. **Transaction context** - All DB operations via queryRunner.manager
3. **Pagination** - Add skip/take to findAll()
4. **Relation loading** - Load transactions when needed, avoid N+1
5. **Same public API** - create(), adjust(), getStatus(), findAll()

---

## Public API (Must Maintain)

```typescript
class ProductsService {
  create(createProductDto: CreateProductDto): Promise<Product>
  adjust(adjustProductDto: AdjustProductDto): Promise<Product>
  getStatus(productId: string): Promise<Product>
  findAll(): Promise<Product[]>
}
```

---

## Known Bugs Detail

### Bug 1: Race Condition
```typescript
// BUGGY: No lock - concurrent reads get stale data
const product = await queryRunner.manager.findOne(Product, {
  where: { id: adjustProductDto.productId },
});

// FIXED: Add pessimistic lock
const product = await queryRunner.manager.findOne(Product, {
  where: { id: adjustProductDto.productId },
  lock: { mode: 'pessimistic_write' },
});
```

### Bug 2: Transaction Context Leak
```typescript
// BUGGY: User lookup outside transaction context
user = await this.usersService.findOne(adjustProductDto.userId);

// FIXED: Use queryRunner.manager for user lookup
user = await queryRunner.manager.findOne(User, { where: { id: adjustProductDto.userId } });
```

### Bug 3: No Pagination
```typescript
// BUGGY: Returns all 50k products
return await this.productRepository.find({
  order: { createdAt: 'DESC' },
});

// FIXED: Add pagination
return await this.productRepository.find({
  order: { createdAt: 'DESC' },
  skip: offset,
  take: limit,
});
```

---

## Commands

### Run repository_before
```bash
docker-compose run --rm app npx ts-node -e "console.log('TypeScript OK')"
```

### Run tests
```bash
docker-compose run --rm app npm test
```

### Run evaluation
```bash
docker-compose run --rm app npx ts-node evaluation/evaluation.ts
```


import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Product } from '../repository_after/database/entities/product.entity';
import { Transaction } from '../repository_after/database/entities/transaction.entity';
import { User } from '../repository_after/database/entities/user.entity';

// Import both implementations
import { ProductsService as ProductsServiceBefore } from '../repository_before/products/products.service';
import { ProductsService as ProductsServiceAfter } from '../repository_after/products/products.service';
import { UsersService } from '../repository_after/users/users.service';

async function makeServices() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    entities: [Product, Transaction, User],
  });
  await dataSource.initialize();

  const productRepo = dataSource.getRepository(Product);
  const transactionRepo = dataSource.getRepository(Transaction);
  const userRepo = dataSource.getRepository(User);

  const usersService = new UsersService(userRepo);

  const before = new ProductsServiceBefore(productRepo, transactionRepo, dataSource, usersService as any);
  const after = new ProductsServiceAfter(productRepo, transactionRepo, dataSource, usersService);

  return { dataSource, productRepo, transactionRepo, userRepo, before, after, usersService };
}

import * as fs from 'fs';
import * as path from 'path';

async function concurrencyTest(ServiceClass: any, n = 10) {
  // Use a file-backed SQLite DB so multiple DataSources can open concurrent connections
  const dbFile = path.join(__dirname, `..`, `.tmp_concurrency.sqlite`);
  try { if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile); } catch (e) { /* ignore */ }

  // Create main DS to initialize schema and seed product
  const mainDS = new DataSource({ type: 'sqlite', database: dbFile, synchronize: true, entities: [Product, Transaction, User], });
  await mainDS.initialize();
  const mainProductRepo = mainDS.getRepository(Product);

  const product = mainProductRepo.create({ name: 'CTest', sku: `CTest-${Math.random()}`, quantity: 100, price: 1 });
  const saved = await mainProductRepo.save(product);

  // Create worker data sources (separate connections) to perform concurrent adjustments
  const workers: DataSource[] = [];
  const workerCount = n;
  for (let i = 0; i < workerCount; i++) {
    const ds = new DataSource({ type: 'sqlite', database: dbFile, synchronize: false, entities: [Product, Transaction, User], });
    workers.push(ds);
  }
  await Promise.all(workers.map((ds) => ds.initialize()));

  // Run adjustments concurrently across worker connections and collect results
  const promises = workers.map(async (ds) => {
    const productRepo = ds.getRepository(Product);
    const transactionRepo = ds.getRepository(Transaction);
    const userRepo = ds.getRepository(User);
    const usersService = new UsersService(userRepo);
    const svc = new ServiceClass(productRepo, transactionRepo, ds, usersService);
    return svc.adjust({ productId: saved.id, quantityChange: 1 } as any);
  });

  const settled = await Promise.allSettled(promises);
  const rejected = settled.filter((s) => s.status === 'rejected') as PromiseRejectedResult[];
  const errorCount = rejected.length;
  const errors = rejected.slice(0, 5).map(r => {
    const msg = r.reason?.message || String(r.reason);
    return msg;
  });

  const final = await mainProductRepo.findOne({ where: { id: saved.id } });

  await Promise.all(workers.map((ds) => ds.destroy()));
  await mainDS.destroy();
  try { if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile); } catch (e) { /* ignore */ }

  return { start: 100, expected: 100 + n, got: final ? final.quantity : null, errorCount, errors };
}

async function usersTransactionLookupTest(serviceBefore: any, serviceAfter: any, productRepo: any, userRepo: any) {
  const product = await productRepo.save(productRepo.create({ name: 'UTest', sku: `U-${Math.random()}`, quantity: 10, price: 1 }));
  const user = await userRepo.save(userRepo.create({ name: 'TempUser', email: `u${Math.random()}@ex.com` }));

  // Replace usersService.findOne to throw if called externally (detects outside-transaction user lookup)
  const throwingUsersService = {
    findOne: async () => {
      throw new Error('External usersService.findOne was called');
    },
  };

  // Create services wired with the throwing usersService
  const beforeWithThrow = new (serviceBefore.constructor)(productRepo.manager.getRepository(Product), productRepo.manager.getRepository(Transaction), productRepo.manager.connection, throwingUsersService as any);
  const afterWithThrow = new (serviceAfter.constructor)(productRepo.manager.getRepository(Product), productRepo.manager.getRepository(Transaction), productRepo.manager.connection, throwingUsersService as any);

  // Before should call external usersService.findOne and therefore throw; After should NOT call it and should succeed
  let beforeThrows = false;
  try {
    await beforeWithThrow.adjust({ productId: product.id, quantityChange: -1, userId: user.id } as any);
  } catch (err) {
    beforeThrows = true;
  }

  let afterSucceeds = true;
  try {
    await afterWithThrow.adjust({ productId: product.id, quantityChange: -1, userId: user.id } as any);
  } catch (err) {
    afterSucceeds = false;
  }

  return { beforeThrows, afterSucceeds };
}

async function paginationTest(serviceBefore: any, serviceAfter: any) {
  // Create 150 products
  const products = Array.from({ length: 150 }).map((_, i) => ({ name: `P${i}`, sku: `SKU${i}`, quantity: i, price: 1 }));
  // We need fresh DataSource/repos in each run so call services' repositories
  await (serviceBefore as any).productRepository.save(products as any);

  process.env.PRODUCTS_PAGE = '0';
  process.env.PRODUCTS_PAGE_SIZE = '100';

  const beforeAll = await (serviceBefore as any).findAll();
  const afterPage0 = await (serviceAfter as any).findAll();

  return { beforeAllCount: beforeAll.length, afterPage0Count: afterPage0.length };
}

async function eagerLoadingTest(serviceBefore: any, serviceAfter: any, productRepo: any, transactionRepo: any, userRepo: any) {
  const user = await userRepo.save(userRepo.create({ name: 'EagerUser', email: `e${Math.random()}@ex.com` }));
  const product = await productRepo.save(productRepo.create({ name: 'EProd', sku: `E-${Math.random()}`, quantity: 5, price: 1 }));

  // Create two transactions referencing the product and user
  const t1 = transactionRepo.create({ type: 'STOCK_IN' as any, quantity: 5, previousQuantity: 0, newQuantity: 5, product, user, remarks: 't1' });
  const t2 = transactionRepo.create({ type: 'ADJUSTMENT' as any, quantity: 1, previousQuantity: 5, newQuantity: 4, product, user, remarks: 't2' });
  await transactionRepo.save([t1, t2]);

  const beforeStatus = await (serviceBefore as any).getStatus(product.id);
  const afterStatus = await (serviceAfter as any).getStatus(product.id);

  const beforeHasTx = Array.isArray(beforeStatus.transactions) && beforeStatus.transactions.length >= 2;
  const afterHasTx = Array.isArray(afterStatus.transactions) && afterStatus.transactions.length >= 2;

  const beforeHasUsers = beforeHasTx ? beforeStatus.transactions.every((t: any) => !!t.user) : false;
  const afterHasUsers = afterHasTx ? afterStatus.transactions.every((t: any) => !!t.user) : false;

  return { beforeHasTx, beforeHasUsers, afterHasTx, afterHasUsers };
}

async function runAll() {
  // Phase 1: Concurrency


  console.log('Running concurrency test (multiple concurrent +1 adjustments) ...');
  let beforeFailed = false;
  for (let i = 0; i < 6; i++) {
    const r = await concurrencyTest(ProductsServiceBefore, 10);
    if (r.errorCount > 0 || r.got !== r.expected) {
      beforeFailed = true;
      console.log(`Detected failure in 'before' (expected ${r.expected} got ${r.got}, errors ${r.errorCount})`);
      break;
    }
  }

  const afterResult = await concurrencyTest(ProductsServiceAfter, 10);
  const afterCorrect = (afterResult.got === afterResult.expected) && afterResult.errorCount === 0;
  if (!afterCorrect) {
    console.error('After concurrency result:', afterResult);
  }

  console.log('Concurrency test results:', { beforeFailed, afterCorrect });

  if (!afterCorrect) {
    console.error('After implementation failed concurrency test');
    process.exit(1);
  }
  if (!beforeFailed) {
    console.error('Before implementation did NOT fail the concurrency test (race not observed). To increase probability, re-run tests with larger concurrency or use a real DB. Failing because requirement says before must fail.');
    process.exit(1);
  }

  // Phase 2: User Lookup (Known to corrupt DB state in 'Before' implementation)
  console.log('Running user lookup / transaction context test ...');
  let s1 = await makeServices();
  const userLookupRes = await usersTransactionLookupTest(s1.before, s1.after, s1.productRepo, s1.userRepo);
  await s1.dataSource.destroy(); // Clean up potential corruption

  if (!userLookupRes.beforeThrows) {
    console.error('Expected before to call external usersService.findOne (and thus throw in this test), but it did not.');
    process.exit(1);
  }
  if (!userLookupRes.afterSucceeds) {
    console.error('Expected after to NOT call external usersService.findOne, but it failed.');
    process.exit(1);
  }

  // Phase 3: Pagination
  console.log('Running pagination test ...');
  let s2 = await makeServices();
  const pageRes = await paginationTest(s2.before, s2.after);
  await s2.dataSource.destroy();

  if (pageRes.afterPage0Count !== 100) {
    console.error(`After pagination failed: expected 100 got ${pageRes.afterPage0Count}`);
    process.exit(1);
  }
  if (pageRes.beforeAllCount === pageRes.afterPage0Count) {
    console.error('Before implementation appears to have pagination; expected it to return all items while after returns paginated');
    process.exit(1);
  }

  // Phase 4: Eager Loading
  console.log('Running eager-loading test (getStatus should include transactions and users) ...');
  let s3 = await makeServices();
  const eagerRes = await eagerLoadingTest(s3.before, s3.after, s3.productRepo, s3.transactionRepo, s3.userRepo);
  await s3.dataSource.destroy();

  if (!eagerRes.afterHasTx || !eagerRes.afterHasUsers) {
    console.error('After implementation failed to eager-load transactions/users');
    process.exit(1);
  }
  if (eagerRes.beforeHasTx) {
    console.error('Before implementation unexpectedly loaded transactions - expected it not to (no relations configured in getStatus)');
    process.exit(1);
  }

  console.log('All tests passed for AFTER and failed as expected for BEFORE ✅');
  process.exit(0);
}

runAll().catch((err) => {
  console.error('Tests failed with error:', err);
  process.exit(1);
});

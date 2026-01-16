
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Product } from '../repository_after/database/entities/product.entity';
import { Transaction } from '../repository_after/database/entities/transaction.entity';
import { User } from '../repository_after/database/entities/user.entity';

import { ProductsService as ProductsServiceAfter } from '../repository_after/products/products.service';
import { UsersService } from '../repository_after/users/users.service';

import * as fs from 'fs';
import * as path from 'path';

// Helper: Make Services
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
    const service = new ProductsServiceAfter(productRepo, transactionRepo, dataSource, usersService);
    return { dataSource, productRepo, transactionRepo, userRepo, service, usersService };
}

// Helper: Concurrency Test
async function concurrencyTest(ServiceClass: any, n = 10) {
    const dbFile = path.join(__dirname, `..`, `.tmp_concurrency_after.sqlite`);
    try { if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile); } catch (e) { /* ignore */ }

    const mainDS = new DataSource({ type: 'sqlite', database: dbFile, synchronize: true, entities: [Product, Transaction, User], });
    await mainDS.initialize();
    const mainProductRepo = mainDS.getRepository(Product);

    const product = mainProductRepo.create({ name: 'CTest', sku: `B-${Math.random()}`, quantity: 100, price: 1 });
    const saved = await mainProductRepo.save(product);

    const workers: DataSource[] = [];
    for (let i = 0; i < n; i++) {
        const ds = new DataSource({ type: 'sqlite', database: dbFile, synchronize: false, entities: [Product, Transaction, User], });
        workers.push(ds);
    }
    await Promise.all(workers.map((ds) => ds.initialize()));

    const promises = workers.map(async (ds) => {
        const productRepo = ds.getRepository(Product);
        const transactionRepo = ds.getRepository(Transaction);
        const userRepo = ds.getRepository(User);
        const usersService = new UsersService(userRepo);
        const svc = new ServiceClass(productRepo, transactionRepo, ds, usersService);
        return svc.adjust({ productId: saved.id, quantityChange: 1 } as any);
    });

    const settled = await Promise.allSettled(promises);
    await Promise.all(workers.map((ds) => ds.destroy()));
    const final = await mainProductRepo.findOne({ where: { id: saved.id } });
    await mainDS.destroy();
    try { if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile); } catch (e) { /* ignore */ }

    const rejected = settled.filter((s) => s.status === 'rejected');
    return { expected: 100 + n, got: final ? final.quantity : null, errorCount: rejected.length };
}

// Helper: User Context Test
async function usersTransactionLookupTest(ServiceClass: any) {
    const { dataSource, productRepo, userRepo, service } = await makeServices();
    const product = await productRepo.save(productRepo.create({ name: 'UTest', sku: `U-${Math.random()}`, quantity: 10, price: 1 }));
    const user = await userRepo.save(userRepo.create({ name: 'TempUser', email: `u${Math.random()}@ex.com` }));

    const throwingUsersService = {
        findOne: async () => { throw new Error('External usersService.findOne was called'); },
    };
    // Inject throwing service
    const serviceWithThrow = new ServiceClass(productRepo.manager.getRepository(Product), productRepo.manager.getRepository(Transaction), productRepo.manager.connection, throwingUsersService as any);

    let throws = false;
    try {
        await serviceWithThrow.adjust({ productId: product.id, quantityChange: -1, userId: user.id } as any);
    } catch (err) {
        throws = true;
    }
    await dataSource.destroy();
    return throws;
}

// Helper: Pagination Test
async function paginationTest(ServiceClass: any) {
    const { dataSource, productRepo, transactionRepo, userRepo, usersService } = await makeServices();
    const service = new ServiceClass(productRepo, transactionRepo, dataSource, usersService);

    const products = Array.from({ length: 150 }).map((_, i) => ({ name: `P${i}`, sku: `SKU${i}`, quantity: i, price: 1 }));
    await productRepo.save(products as any);

    process.env.PRODUCTS_PAGE = '0';
    process.env.PRODUCTS_PAGE_SIZE = '100';

    const results = await service.findAll();
    await dataSource.destroy();
    return results.length;
}

// Helper: Eager Loading Test
async function eagerLoadingTest(ServiceClass: any) {
    const { dataSource, productRepo, transactionRepo, userRepo, service } = await makeServices();

    const user = await userRepo.save(userRepo.create({ name: 'EagerUser', email: `e${Math.random()}@ex.com` }));
    const product = await productRepo.save(productRepo.create({ name: 'EProd', sku: `E-${Math.random()}`, quantity: 5, price: 1 }));
    const t1 = transactionRepo.create({ type: 'STOCK_IN' as any, quantity: 5, previousQuantity: 0, newQuantity: 5, product, user, remarks: 't1' });
    await transactionRepo.save([t1]);

    const status = await service.getStatus(product.id);
    await dataSource.destroy();

    const hasTx = Array.isArray(status.transactions) && status.transactions.length > 0;
    const hasUser = hasTx ? !!status.transactions[0].user : false;
    return { hasTx, hasUser };
}

async function runAfter() {
    console.log('--- TESTING AFTER REPOSITORY (Fixed Code) ---');
    console.log('Expectation: All tests should PASS');

    let passedChecks = 0;

    // 1. Concurrency
    console.log('Running Concurrency Test...');
    const cRes = await concurrencyTest(ProductsServiceAfter, 10);
    if (cRes.got === cRes.expected && cRes.errorCount === 0) {
        console.log(`[PASS] Concurrency Correct`);
        passedChecks++;
    } else {
        console.log(`[FAIL] Concurrency Failed (Expected ${cRes.expected}, Got ${cRes.got})`);
    }

    // 2. Transaction Context
    console.log('Running Transaction Context Leaks Test...');
    // Should NOT throw because it uses the internal manager
    const contextThrows = await usersTransactionLookupTest(ProductsServiceAfter);
    if (!contextThrows) {
        console.log(`[PASS] Transaction Context Safe (Did not leak)`);
        passedChecks++;
    } else {
        console.log(`[FAIL] Transaction Context Leaked (Threw error)`);
    }

    // 3. Pagination
    console.log('Running Pagination Test...');
    const count = await paginationTest(ProductsServiceAfter);
    if (count === 100) {
        console.log(`[PASS] Pagination Working (Got ${count} items)`);
        passedChecks++;
    } else {
        console.log(`[FAIL] Pagination Failed (Got ${count} items)`);
    }

    // 4. Eager Loading
    console.log('Running Eager Loading Test...');
    const { hasTx, hasUser } = await eagerLoadingTest(ProductsServiceAfter);
    if (hasTx && hasUser) {
        console.log(`[PASS] Eager Loading Working`);
        passedChecks++;
    } else {
        console.log(`[FAIL] Eager Loading Failed`);
    }

    if (passedChecks === 4) {
        console.log('STATUS: SUCCESS (All requirements met)');
        process.exit(0);
    } else {
        console.log(`STATUS: FAILED (Only passed ${passedChecks}/4 requirements)`);
        process.exit(1);
    }
}

runAfter().catch(console.error);

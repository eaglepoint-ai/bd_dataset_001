
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Product } from '../repository_after/database/entities/product.entity';
import { Transaction } from '../repository_after/database/entities/transaction.entity';
import { User } from '../repository_after/database/entities/user.entity';

// Import both implementations
import { ProductsService as ProductsServiceBefore } from '../repository_before/products/products.service';
import { ProductsService as ProductsServiceAfter } from '../repository_after/products/products.service';
import { UsersService } from '../repository_after/users/users.service';

import * as fs from 'fs';
import * as path from 'path';

async function concurrencyTest(ServiceClass: any, n = 10) {
    // Use a file-backed SQLite DB so multiple DataSources can open concurrent connections
    const dbFile = path.join(__dirname, `..`, `.tmp_concurrency_quick.sqlite`);
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

    console.log(`Starting ${n} concurrent adjustments...`);

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

async function runQuick() {
    console.log('Running quick concurrency test with n=10...');
    const result = await concurrencyTest(ProductsServiceAfter, 10);
    console.log('Result:', result);
    if (result.got === result.expected) {
        console.log('SUCCESS');
        process.exit(0);
    } else {
        console.log('FAILURE');
        process.exit(1);
    }
}

runQuick().catch(console.error);

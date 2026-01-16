
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Product } from '../repository_after/database/entities/product.entity';
import { Transaction } from '../repository_after/database/entities/transaction.entity';
import { User } from '../repository_after/database/entities/user.entity';
import { ProductsService as ProductsServiceAfter } from '../repository_after/products/products.service';
import { UsersService } from '../repository_after/users/users.service';

async function run() {
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
    const after = new ProductsServiceAfter(productRepo, transactionRepo, dataSource, usersService);

    // Create 150 products
    const products = Array.from({ length: 150 }).map((_, i) => productRepo.create({ name: `P${i}`, sku: `SKU${i}`, quantity: i, price: 1 }));
    await productRepo.save(products);

    process.env.PRODUCTS_PAGE = '0';
    process.env.PRODUCTS_PAGE_SIZE = '100';

    const p0 = await after.findAll();
    console.log(`Page 0 count: ${p0.length}`);

    process.env.PRODUCTS_PAGE = '1';
    const p1 = await after.findAll();
    console.log(`Page 1 count: ${p1.length}`);

    if (p0.length === 100 && p1.length === 50) {
        console.log('SUCCESS');
        process.exit(0);
    } else {
        console.log('FAILURE');
        process.exit(1);
    }
}

run().catch(console.error);

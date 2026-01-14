import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../database/entities/product.entity';
import { Transaction, TransactionType } from '../database/entities/transaction.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { AdjustProductDto } from './dto/adjust-product.dto';
import { UsersService } from '../users/users.service';
import { User } from '../database/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
  ) { }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = this.productRepository.create(createProductDto);
      const savedProduct = await queryRunner.manager.save(Product, product);

      if (createProductDto.quantity > 0) {
        const transaction = this.transactionRepository.create({
          type: TransactionType.STOCK_IN,
          quantity: createProductDto.quantity,
          previousQuantity: 0,
          newQuantity: createProductDto.quantity,
          product: savedProduct,
          remarks: 'Initial stock',
        });
        await queryRunner.manager.save(Transaction, transaction);
      }

      await queryRunner.commitTransaction();
      return savedProduct;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to create product');
    } finally {
      await queryRunner.release();
    }
  }

  async adjust(adjustProductDto: AdjustProductDto): Promise<Product> {
    // Make retry behaviour adaptive based on DB type (SQLite needs more retries due to file locking)
    const isSqlite = (this.dataSource.options as any).type === 'sqlite';
    const MAX_RETRIES = isSqlite ? 60 : 6;
    const BASE_DELAY_MS = isSqlite ? 5 : 10; // keep small base delay, use exponential backoff

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      try {
        // For SQLite, use PRAGMA to improve concurrency and set a busy timeout
        if (isSqlite) {
          try {
            await queryRunner.query("PRAGMA journal_mode = 'WAL'");
            await queryRunner.query('PRAGMA busy_timeout = 2000');
          } catch (pragmaErr) {
            // ignore pragma errors
          }
        }

        if (isSqlite) {
          await queryRunner.query('BEGIN IMMEDIATE');
          (queryRunner as any).isTransactionActive = true;
        } else {
          await queryRunner.startTransaction();
        }

        const delta = adjustProductDto.quantityChange;

        // Use pessimistic locking (SELECT FOR UPDATE) as per requirements
        // SQLite doesn't support SELECT FOR UPDATE, so we rely on BEGIN IMMEDIATE (above)
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: adjustProductDto.productId },
          lock: isSqlite ? undefined : { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${adjustProductDto.productId} not found`);
        }

        const previousQuantity = product.quantity;
        const newQuantity = previousQuantity + adjustProductDto.quantityChange;

        if (newQuantity < 0) {
          throw new BadRequestException('Adjustment would result in negative quantity');
        }

        product.quantity = newQuantity;
        const updated = await queryRunner.manager.save(Product, product);

        // Lookup user within the same transaction context to avoid context leaks
        let user: User = null;
        if (adjustProductDto.userId) {
          user = await queryRunner.manager.findOne(User, { where: { id: adjustProductDto.userId } });
          if (!user) {
            throw new NotFoundException(`User with ID ${adjustProductDto.userId} not found`);
          }
        }

        const transactionType =
          adjustProductDto.quantityChange > 0
            ? TransactionType.STOCK_IN
            : adjustProductDto.quantityChange < 0
              ? TransactionType.STOCK_OUT
              : TransactionType.ADJUSTMENT;

        const transaction = this.transactionRepository.create({
          type: transactionType,
          quantity: Math.abs(adjustProductDto.quantityChange),
          previousQuantity,
          newQuantity,
          product: updated,
          user,
          remarks: adjustProductDto.remarks || null,
        });

        await queryRunner.manager.save(Transaction, transaction);

        await queryRunner.commitTransaction();
        await queryRunner.release();

        return updated;
      } catch (error) {
        // Attempt to rollback only if transaction is active
        try {
          if ((queryRunner as any).isTransactionActive) {
            await queryRunner.rollbackTransaction();
          }
        } catch (rbErr) {
          // ignore rollback errors
        }

        await queryRunner.release();

        // Determine whether this is a transient DB lock/busy error and should be retried
        const rawMsg = (error && (error.message || String(error))) as string;
        const lower = rawMsg.toLowerCase();
        const code = error && (error.code || (error.driverError && error.driverError.code));
        const isBusy = lower.includes('sqlite_busy') || lower.includes('sqlite_locked') || lower.includes('database is locked') || lower.includes('locked') || lower.includes('busy') || lower.includes('could not start transaction') || lower.includes('transaction is not started') || code === 'SQLITE_BUSY' || code === 'SQLITE_LOCKED';

        if (isBusy && attempt < MAX_RETRIES - 1) {
          // exponential backoff with jitter
          const backoff = Math.min(500, Math.pow(2, attempt) * BASE_DELAY_MS);
          const jitter = Math.floor(Math.random() * 10);
          const delay = backoff + jitter;
          await new Promise((res) => setTimeout(res, delay));
          continue; // retry
        }

        // Map certain errors to domain exceptions and rethrow
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }

        // Surface original message for easier debugging
        throw new InternalServerErrorException(`Failed to adjust product quantity: ${rawMsg}`);
      }
    }

    // If we exhausted retries
    throw new InternalServerErrorException('Failed to adjust product quantity after retries');
  }

  async getStatus(productId: string): Promise<Product> {
    if (!productId) {
      throw new BadRequestException('Product ID is required');
    }

    // Eagerly load transactions and their user in a single query to avoid N+1
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['transactions', 'transactions.user'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return product;
  }


  async findAll(): Promise<Product[]> {
    const page = Number(process.env.PRODUCTS_PAGE || '0');
    const pageSize = Number(process.env.PRODUCTS_PAGE_SIZE || '100');

    const take = Math.max(1, Math.min(pageSize, 1000)); // clamp between 1 and 1000
    const skip = Math.max(0, page) * take;

    return await this.productRepository.find({
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }
}

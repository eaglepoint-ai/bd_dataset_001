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

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
  ) {}

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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // BUG: Missing pessimistic lock - concurrent reads get stale data
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: adjustProductDto.productId },
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
      const updatedProduct = await queryRunner.manager.save(Product, product);

      // BUG: User lookup outside transaction context - can reference non-existent user
      let user = null;
      if (adjustProductDto.userId) {
        user = await this.usersService.findOne(adjustProductDto.userId);
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
        product: updatedProduct,
        user,
        remarks: adjustProductDto.remarks || null,
      });

      await queryRunner.manager.save(Transaction, transaction);
      await queryRunner.commitTransaction();

      return updatedProduct;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to adjust product quantity');
    } finally {
      await queryRunner.release();
    }
  }

  async getStatus(productId: string): Promise<Product> {
    if (!productId) {
      throw new BadRequestException('Product ID is required');
    }

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return product;
  }

  // BUG: No pagination - returns all 50k products causing memory issues
  async findAll(): Promise<Product[]> {
    return await this.productRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}


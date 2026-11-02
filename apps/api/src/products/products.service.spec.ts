import { jest } from '@jest/globals';
import type { Product } from './products.service';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

type ProductRecord = {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  productIngredients: {
    ingredientId: number;
    quantity: number;
    isOptional: boolean;
    ingredient: { name: string; stockQuantity: number };
  }[];
};

describe('ProductsService (Prisma)', () => {
  const findMany = jest.fn<() => Promise<ProductRecord[]>>();

  const findUnique = jest.fn<
    () => Promise<ProductRecord | null>
  >();
  const prisma = {
    product: { findMany, findUnique },
  } as unknown as PrismaService;
  const service = new ProductsService(prisma);

  const product = {
    id: 3,
    name: 'Mocha',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31',
    productIngredients: [
      {
        ingredientId: 1,
        quantity: 30,
        isOptional: false,
        ingredient: { name: 'Espresso', stockQuantity: 60 },
      },
    ],
  };
  const apiProduct: Product = {
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    inStock: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /products reads the menu from Prisma, ordered by id', async () => {
    findMany.mockResolvedValue([product]);

    await expect(service.findAll()).resolves.toEqual([apiProduct]);
    expect(findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        productIngredients: {
          select: {
            ingredientId: true,
            quantity: true,
            isOptional: true,
            ingredient: { select: { name: true, stockQuantity: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  });

  it('GET /products returns an empty array when there are no rows', async () => {
    findMany.mockResolvedValue([]);
    await expect(service.findAll()).resolves.toEqual([]);
  });

  it('GET /products/:id returns the matching row', async () => {
    findUnique.mockResolvedValue(product);

    await expect(service.findOne(3)).resolves.toEqual(apiProduct);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 3 },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        productIngredients: {
          select: {
            ingredientId: true,
            quantity: true,
            isOptional: true,
            ingredient: { select: { name: true, stockQuantity: true } },
          },
        },
      },
    });
  });

  it('marks a product out of stock when a required ingredient is short', async () => {
    findUnique.mockResolvedValue({
      ...product,
      productIngredients: [{
        ...product.productIngredients[0],
        ingredient: { name: 'Espresso', stockQuantity: 29 },
      }],
    });

    await expect(service.findOne(3)).resolves.toMatchObject({ inStock: false });
  });

  it('GET /products/:id returns 404 when the id does not exist', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.findOne(999999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates DB failures instead of silently returning hard-coded products', async () => {
    findMany.mockRejectedValue(new Error('Database unavailable'));
    await expect(service.findAll()).rejects.toThrow('Database unavailable');
  });
});

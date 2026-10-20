import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService (Prisma)', () => {
  const findMany = jest.fn();
  const findUnique = jest.fn();
  const prisma = {
    product: { findMany, findUnique },
  } as unknown as PrismaService;
  const service = new ProductsService(prisma);

  const product = {
    id: 3,
    name: 'Mocha',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31',
    stock: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /products reads the menu from Prisma, ordered by id', async () => {
    findMany.mockResolvedValue([product]);

    await expect(service.findAll()).resolves.toEqual([product]);
    expect(findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, price: true, imageUrl: true, stock: true },
      orderBy: { id: 'asc' },
    });
  });

  it('GET /products returns an empty array when there are no rows', async () => {
    findMany.mockResolvedValue([]);
    await expect(service.findAll()).resolves.toEqual([]);
  });

  it('GET /products/:id returns the matching row', async () => {
    findUnique.mockResolvedValue(product);

    await expect(service.findOne(3)).resolves.toEqual(product);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 3 },
      select: { id: true, name: true, price: true, imageUrl: true, stock: true },
    });
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

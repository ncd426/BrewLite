import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Preserve the original exported type for teammates importing Product.
export type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
};

// Only expose fields required by the menu API. Do not leak internal DB metadata.
const productFields = {
  id: true,
  name: true,
  price: true,
  imageUrl: true,
  stock: true,
} as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /products: one indexed DB query, stable order, JSON array.
  findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({
      select: productFields,
      orderBy: { id: 'asc' },
    });
  }

  // GET /products/:id: 404 when the requested product does not exist.
  async findOne(id: number): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: productFields,
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }
}

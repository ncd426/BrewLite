import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  isRecipeInStock,
  type RecipeIngredient,
} from '../inventory/recipe-inventory';

// Preserve the original exported type for teammates importing Product.
export type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
};

const productFields = {
  id: true,
  name: true,
  price: true,
  imageUrl: true,
  productIngredients: {
    select: {
      ingredientId: true,
      quantity: true,
      isOptional: true,
      ingredient: {
        select: {
          name: true,
          stockQuantity: true,
        },
      },
    },
  },
} as const;

function toProduct(product: {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  productIngredients: RecipeIngredient[];
}): Product {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    inStock: isRecipeInStock(product.productIngredients),
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /products: one indexed DB query, stable order, JSON array.
  async findAll(): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      select: productFields,
      orderBy: { id: 'asc' },
    });

    return products.map(toProduct);
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

    return toProduct(product);
  }
}

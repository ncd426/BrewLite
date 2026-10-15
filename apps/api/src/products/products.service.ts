import { Injectable, NotFoundException } from '@nestjs/common';

export type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
};

@Injectable()
export class ProductsService {
  private readonly items: Product[] = [
    { id: 1, name: 'Cà phê sữa', price: 35000, imageUrl: 'https://images.unsplash.com/photo-1497636577773-f2a944c4f6d9', stock: 12 },
    { id: 2, name: 'Americano', price: 40000, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93', stock: 8 },
    { id: 3, name: 'Mocha', price: 45000, imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31', stock: 5 },
  ];

  findAll(): Product[] {
    return this.items;
  }

  findOne(id: number): Product {
    const product = this.items.find((item) => item.id === id);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }
}

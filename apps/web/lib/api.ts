export type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
};

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${apiBaseUrl}/products`);
  if (!response.ok) {
    throw new Error('Unable to fetch products');
  }

  return response.json();
}

export async function fetchProduct(id: number): Promise<Product> {
  const response = await fetch(`${apiBaseUrl}/products/${id}`);
  if (!response.ok) {
    throw new Error('Unable to fetch product');
  }

  return response.json();
}

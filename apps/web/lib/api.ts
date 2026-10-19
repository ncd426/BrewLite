export type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
};

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type AuthResponse = {
  id: number;
  email: string;
  accessToken: string;
};

export type OrderItemInput = {
  productId: number;
  size: string;
  qty: number;
  price: number;
};

export type OrderResponse = {
  orderId: number;
  status: string;
  total: number;
  userId: number;
  items: OrderItemInput[];
};

const ACCESS_TOKEN_KEY = 'brewlite-access-token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAccessToken(token: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body: { message?: string | string[] } = await response.json();
      if (body.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message;
      }
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }

    if (response.status === 401) clearAccessToken();
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function fetchProducts(): Promise<Product[]> {
  return apiRequest<Product[]>('/products');
}

export async function fetchProduct(id: number): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function createOrder(
  items: OrderItemInput[],
): Promise<OrderResponse> {
  return apiRequest<OrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

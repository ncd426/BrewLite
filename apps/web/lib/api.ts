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
  name: string;
  email: string;
  accessToken: string;
};

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  loyaltyPoints: number;
  createdAt: string;
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
const USER_NAME_KEY = 'brewlite-user-name';
const USER_EMAIL_KEY = 'brewlite-user-email';
const AUTH_STATE_EVENT = 'brewlite-auth-change';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(USER_EMAIL_KEY);
}

export function getUserName(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(USER_NAME_KEY);
}

export function saveAccessToken(token: string, name: string, email: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.localStorage.setItem(USER_NAME_KEY, name);
  window.localStorage.setItem(USER_EMAIL_KEY, email);
  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
}

export function clearAccessToken(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_NAME_KEY);
  window.localStorage.removeItem(USER_EMAIL_KEY);
  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
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
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function fetchMyProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me');
}

export async function createOrder(
  items: OrderItemInput[],
): Promise<OrderResponse> {
  return apiRequest<OrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export type PaymentMethod = 'MOMO' | 'CARD';

export type PaymentPayload = {
  orderId: number;
  method: PaymentMethod;
};

export type PaymentResponse = {
  paymentId?: number;
  orderId: number;
  status: 'PAID' | 'PAYMENT_FAILED';
  method?: PaymentMethod;
  amount?: number;
  message?: string;
};

export async function processPayment(
  payload: PaymentPayload,
  idempotencyKey: string,
): Promise<PaymentResponse> {
  return apiRequest<PaymentResponse>('/payments', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}

export type OrderDetailItem = {
  id?: number;
  productId: number;
  productName?: string;
  size: string;
  qty: number;
  price: number;
  unitPrice?: number;
  lineTotal?: number;
};

export type OrderHistoryItem = {
  id: number;
  orderId?: number;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED' | string;
  total: number;
  createdAt: string;
  items: OrderDetailItem[];
};

export async function fetchMyOrders(): Promise<OrderHistoryItem[]> {
  return apiRequest<OrderHistoryItem[]>('/orders/me');
}

export async function fetchOrderById(id: number | string): Promise<OrderHistoryItem> {
  return apiRequest<OrderHistoryItem>(`/orders/${id}`);
}
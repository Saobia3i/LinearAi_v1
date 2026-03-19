import axios from "axios";
import type {
  AccountInfo,
  AdminOrderSummary,
  ApiResponse,
  AuthUser,
  CartResponse,
  DashboardSummary,
  OrderSummary,
  Product,
  ProductSubscription,
  VoucherSummary
} from "./types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/",
  withCredentials: true
});

export function getErrorMessage(error: unknown, fallback = "Request failed") {
  if (!axios.isAxiosError(error)) return fallback;

  const responseData = error.response?.data as { message?: string; errors?: string[] } | undefined;
  if (responseData?.message) return responseData.message;
  if (responseData?.errors?.length) return responseData.errors[0];
  return fallback;
}

export async function login(payload: { email: string; password: string; rememberMe: boolean }) {
  const response = await api.post<ApiResponse<{ id: string; fullName: string; email: string; role: string }>>(
    "api/auth/login",
    payload
  );

  return response.data;
}

export async function signup(payload: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const response = await api.post<ApiResponse<{ email: string }>>("api/auth/register", payload);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get<ApiResponse<AuthUser>>("api/auth/me");
  return response.data;
}

export async function logout() {
  const response = await api.post<ApiResponse<null>>("api/auth/logout");
  return response.data;
}

export async function getProducts() {
  const response = await api.get<ApiResponse<Product[]>>("api/user/products");
  return response.data;
}

export async function getCart(voucherCode?: string) {
  const query = voucherCode ? `?voucherCode=${encodeURIComponent(voucherCode)}` : "";
  const response = await api.get<ApiResponse<CartResponse>>(`api/user/cart${query}`);
  return response.data;
}

export async function addToCart(productId: number, durationMonths: number) {
  const response = await api.post<ApiResponse<unknown>>("api/user/cart/items", { productId, durationMonths });
  return response.data;
}

export async function removeFromCart(productId: number, durationMonths?: number) {
  const query = durationMonths ? `?durationMonths=${durationMonths}` : "";
  const response = await api.delete<ApiResponse<unknown>>(`api/user/cart/items/${productId}${query}`);
  return response.data;
}

export async function applyVoucher(voucherCode: string) {
  const response = await api.post<ApiResponse<CartResponse>>("api/user/cart/voucher", { voucherCode });
  return response.data;
}

export async function checkout(voucherCode?: string) {
  const response = await api.post<ApiResponse<{ orderCount: number; total: number }>>("api/user/checkout", { voucherCode });
  return response.data;
}

export async function getOrders() {
  const response = await api.get<ApiResponse<OrderSummary[]>>("api/user/orders");
  return response.data;
}

export async function getAccount() {
  const response = await api.get<ApiResponse<AccountInfo>>("api/user/account");
  return response.data;
}

export async function getAdminDashboard() {
  const response = await api.get<ApiResponse<DashboardSummary>>("api/admin/dashboard");
  return response.data;
}

export async function getAdminProducts() {
  const response = await api.get<ApiResponse<Product[]>>("api/admin/products");
  return response.data;
}

export async function createAdminProduct(payload: { title: string; shortDescription: string; price: number }) {
  const response = await api.post<ApiResponse<unknown>>("api/admin/products", payload);
  return response.data;
}

export async function updateAdminProduct(
  id: number,
  payload: { title: string; shortDescription: string; price: number; isActive: boolean }
) {
  const response = await api.put<ApiResponse<unknown>>(`api/admin/products/${id}`, payload);
  return response.data;
}

export async function saveAdminSubscription(
  productId: number,
  payload: { durationMonths: number; price: number; discountPercent: number; isActive: boolean }
) {
  const response = await api.post<ApiResponse<unknown>>(`api/admin/products/${productId}/subscriptions`, payload);
  return response.data;
}

export async function deleteAdminSubscription(subscriptionId: number) {
  const response = await api.delete<ApiResponse<unknown>>(`api/admin/subscriptions/${subscriptionId}`);
  return response.data;
}

export async function getAdminVouchers() {
  const response = await api.get<ApiResponse<VoucherSummary[]>>("api/admin/vouchers");
  return response.data;
}
export async function createAdminVoucher(payload: {
  code: string;
  description: string;
  discountPercent: number;
  maxDiscountAmount: number;
  minimumOrderAmount: number;
  maxUses: number;
  expiryDate?: string;
}) {
  const response = await api.post<ApiResponse<unknown>>("api/admin/vouchers", payload);
  return response.data;
}

export async function toggleAdminVoucher(id: number) {
  const response = await api.patch<ApiResponse<unknown>>(`api/admin/vouchers/${id}/toggle`);
  return response.data;
}

export async function getAdminOrders() {
  const response = await api.get<ApiResponse<AdminOrderSummary[]>>("api/orders");
  return response.data;
}

export async function updateAdminOrderStatus(id: number, status: string) {
  const response = await api.patch<ApiResponse<unknown>>(`api/orders/${id}/status`, { status });
  return response.data;
}

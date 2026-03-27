export type ProductSubscription = {
  id: number;
  durationMonths: number;
  price: number;
  discountPercent: number;
  finalPrice: number;
  isActive: boolean;
};

export type Product = {
  id: number;
  title: string;
  shortDescription: string;
  price: number;
  isActive?: boolean;
  createdAt: string;
  subscriptions: ProductSubscription[];
};

export type CartItem = {
  productId: number;
  productTitle: string;
  basePrice: number;
  durationMonths: number;
  finalPrice: number;
};

export type CheckoutSummary = {
  cartItems: CartItem[];
  voucherCode?: string;
  subTotal: number;
  bundleDiscount: number;
  voucherDiscount: number;
  total: number;
  voucherMessage?: string;
  voucherValid: boolean;
};

export type CartResponse = {
  cartCount: number;
  items: CartItem[];
  summary: CheckoutSummary;
};

export type OrderSummary = {
  id: number;
  productId: number;
  productTitle: string;
  durationMonths?: number;
  originalPrice?: number;
  discountAmount?: number;
  finalAmount: number;
  paymentStatus: string;
  orderDate: string;
  subscriptionEndDate?: string;
  voucherCode?: string;
};

export type AdminOrderSummary = {
  id: number;
  clientEmail: string;
  product: string;
  price: number;
  paymentStatus: string;
  orderDate: string;
};

export type VoucherSummary = {
  id: number;
  code: string;
  description: string;
  discountPercent: number;
  maxDiscountAmount: number;
  minimumOrderAmount: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiryDate?: string;
  createdAt: string;
};

export type DashboardSummary = {
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  activeProducts: number;
  totalVouchers: number;
  activeVouchers: number;
};

export type AccountInfo = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  emailConfirmed?: boolean;
  createdAt: string;
  isActive: boolean;
};

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

export type FeedbackItem = {
  id: number;
  message: string;
  type: string;
  subject?: string;
  isPosted: boolean;
  createdAt: string;
  userName: string;
  userEmail?: string;
};

export type PublicReview = {
  id: number;
  message: string;
  createdAt: string;
  userName: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

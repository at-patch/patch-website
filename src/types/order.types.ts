export type OrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "bkash" | "nagad" | "card";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  product: string;
  sku: string;
  name: string;
  price: number;
  basePrice?: number;
  image?: string;
  size: string;
  color?: string;
  weightKg?: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  citySlug?: string;
  countryCode?: string;
  district?: string;
  districtSlug?: string;
  shippingCost?: number;
  notes?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer?: string;
  items: OrderItem[];
  subtotal: number;
  baseSubtotal?: number;
  total: number;
  baseTotal?: number;
  shippingCost?: number;
  baseShippingCost?: number;
  baseCurrency?: string;
  currency: string;
  totalWeightKg?: number;
  chargeableWeightKg?: number;
  shippingRuleId?: string;
  exchangeRate?: number;
  exchangeRateTimestamp?: string;
  exchangeRateSource?: string;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  stripePaymentIntentId?: string;
  couponCode?: string;
  discount?: number;
  baseDiscount?: number;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  currency?: "BDT" | "USD" | "EUR" | "GBP" | "CNY";
  couponCode?: string;
}

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
  image?: string;
  size: string;
  color?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  citySlug?: string;
  shippingCost?: number;
  notes?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer?: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  shippingCost?: number;
  currency: string;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  stripePaymentIntentId?: string;
  couponCode?: string;
  discount?: number;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

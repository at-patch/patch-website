export type CouponType = "percent" | "flat";

export interface Coupon {
  _id: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotal: number;
  expiresAt?: string | null;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidationResult {
  code: string;
  discount: number;
}

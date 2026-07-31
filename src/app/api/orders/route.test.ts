import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findById,
  orderCreate,
  claimStockForItem,
  releaseStockForItem,
  resolveShippingForWeight,
  getCurrencySnapshot,
} = vi.hoisted(() => ({
  findById: vi.fn(),
  orderCreate: vi.fn(),
  claimStockForItem: vi.fn(),
  releaseStockForItem: vi.fn(),
  resolveShippingForWeight: vi.fn(),
  getCurrencySnapshot: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ connectToDatabase: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/require-customer", () => ({ requireCustomer: vi.fn().mockResolvedValue("customer-1") }));
vi.mock("@/lib/models/Product", () => ({ default: { findById } }));
vi.mock("@/lib/models/Order", () => ({ default: { create: orderCreate } }));
vi.mock("@/lib/inventory", () => ({ claimStockForItem, releaseStockForItem }));
vi.mock("@/lib/coupons", () => ({
  claimCoupon: vi.fn(),
  releaseCouponClaim: vi.fn(),
}));
vi.mock("@/lib/email", () => ({ sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));
vi.mock("@/lib/utils", () => ({ generateOrderNumber: vi.fn().mockReturnValue("PAT-ORDER-1") }));
vi.mock("@/lib/shipping-quote", () => ({ resolveShippingForWeight }));
vi.mock("@/lib/currency", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/currency")>();
  return { ...original, getCurrencySnapshot };
});

import { POST } from "./route";

const requestBody = {
  items: [{
    product: "64f100000000000000000001",
    sku: "CLIENT-SKU",
    name: "Client supplied name",
    price: 1,
    size: "M",
    color: " Indigo ",
  }],
  shippingAddress: {
    fullName: "Ada Lovelace",
    phone: "+8801712345678",
    email: "ada@example.com",
    addressLine: "123 Main St",
    city: "Dhaka",
    citySlug: "dhaka",
    countryCode: "BD",
    district: "Dhaka",
    districtSlug: "dhaka",
  },
  paymentMethod: "card",
};

function request(body = requestBody) {
  return {
    url: "http://localhost/api/orders",
    json: vi.fn().mockResolvedValue(body),
  } as never;
}

describe("order creation shipping snapshots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: requestBody.items[0].product,
          sku: "SERVER-SKU",
          name: "Server Product",
          price: 1500,
          images: ["https://example.com/product.jpg"],
          weightKg: 1.4,
        }),
      }),
    });
    claimStockForItem.mockResolvedValue(true);
    resolveShippingForWeight.mockResolvedValue({
      destination: {
        id: "zone-1",
        countryCode: "BD",
        countryName: "Bangladesh",
        scope: "district",
        district: "Dhaka",
        districtSlug: "dhaka",
        currency: "BDT",
      },
      totalWeightKg: 1.4,
      chargeableWeightKg: 2,
      shippingCost: 110,
      currency: "BDT",
      shippingRuleId: "zone-1",
    });
    getCurrencySnapshot.mockImplementation(async (currency: string) => ({
      currency,
      rate: currency === "BDT" ? 1 : 0.01,
      baseCurrency: "BDT",
      source: currency === "BDT" ? "base-fallback" : "coinbase",
      timestamp: "2026-07-28T00:00:00.000Z",
    }));
    orderCreate.mockImplementation(async (value) => ({
      _id: "order-1",
      ...value,
      shippingAddress: value.shippingAddress,
    }));
  });

  it("uses server product values and snapshots weight-based shipping", async () => {
    const response = await POST(request());

    expect(response.status).toBe(201);
    expect(resolveShippingForWeight).toHaveBeenCalledWith(
      { countryCode: "BD", districtSlug: "dhaka" },
      1.4
    );
    expect(orderCreate).toHaveBeenCalledWith(expect.objectContaining({
      subtotal: 1500,
      baseSubtotal: 1500,
      shippingCost: 110,
      baseShippingCost: 110,
      totalWeightKg: 1.4,
      chargeableWeightKg: 2,
      shippingRuleId: "zone-1",
      total: 1610,
      baseTotal: 1610,
      currency: "BDT",
      items: [expect.objectContaining({
        sku: "SERVER-SKU",
        name: "Server Product",
        price: 1500,
        weightKg: 1.4,
      })],
    }));
  });

  it("converts and snapshots the charged currency without changing canonical values", async () => {
    const response = await POST(request({ ...requestBody, currency: "USD" }));

    expect(response.status).toBe(201);
    expect(orderCreate).toHaveBeenCalledWith(expect.objectContaining({
      subtotal: 15,
      baseSubtotal: 1500,
      shippingCost: 1.1,
      baseShippingCost: 110,
      total: 16.1,
      baseTotal: 1610,
      baseCurrency: "BDT",
      currency: "USD",
      exchangeRate: 0.01,
      items: [expect.objectContaining({ price: 15, basePrice: 1500 })],
    }));
  });

  it("releases claimed stock when shipping is unavailable", async () => {
    resolveShippingForWeight.mockResolvedValue(null);

    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(orderCreate).not.toHaveBeenCalled();
    expect(releaseStockForItem).toHaveBeenCalledWith({
      product: requestBody.items[0].product,
      size: "M",
      color: "Indigo",
    });
  });
});

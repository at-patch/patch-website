import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, bulkWrite, find } = vi.hoisted(() => ({
  create: vi.fn(),
  bulkWrite: vi.fn(),
  find: vi.fn(),
}));

vi.mock("@/lib/require-admin", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ email: "admin@example.com" }),
}));
vi.mock("@/lib/db", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/models/ShippingZone", () => ({
  default: { create, bulkWrite, find },
}));

import { POST, PUT } from "./route";

function request(body?: unknown) {
  return {
    url: "http://localhost/api/admin/shipping-zones",
    json: vi.fn().mockResolvedValue(body),
  } as never;
}

describe("admin shipping zones route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    create.mockImplementation(async (value) => ({ _id: "zone-1", ...value }));
    bulkWrite.mockResolvedValue({ upsertedCount: 64 });
    find.mockReturnValue({
      sort: vi.fn().mockResolvedValue(Array.from({ length: 64 }, (_, index) => ({ _id: `zone-${index}` }))),
    });
  });

  it("creates a normalized international country rule", async () => {
    const response = await POST(request({
      countryCode: "us",
      countryName: "United States",
      scope: "country",
      baseRate: 1800,
      additionalKgRate: 400,
      currency: "bdt",
      isActive: true,
    }));

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      countryCode: "US",
      district: "",
      districtSlug: "",
      currency: "BDT",
    }));
  });

  it("seeds all 64 Bangladesh districts idempotently", async () => {
    const response = await PUT(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(bulkWrite).toHaveBeenCalledOnce();
    expect(bulkWrite.mock.calls[0][0]).toHaveLength(64);
    expect(body.total).toBe(64);
  });
});

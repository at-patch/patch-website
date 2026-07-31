import { beforeEach, describe, expect, it, vi } from "vitest";

const { find, countDocuments } = vi.hoisted(() => ({
  find: vi.fn(),
  countDocuments: vi.fn(),
}));

vi.mock("@/lib/require-admin", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ email: "admin@example.com" }),
}));
vi.mock("@/lib/db", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/models/Order", () => ({
  default: { find, countDocuments },
}));

import { GET } from "./route";

function request(query = "") {
  return { url: `http://localhost/api/admin/orders${query}` } as never;
}

describe("admin orders list filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    countDocuments.mockResolvedValue(1);
    const limit = vi.fn().mockResolvedValue([{ orderNumber: "PAT-001" }]);
    const skip = vi.fn().mockReturnValue({ limit });
    const sort = vi.fn().mockReturnValue({ skip });
    find.mockReturnValue({ sort });
  });

  it("combines order and payment status filters", async () => {
    const response = await GET(request("?status=confirmed&paymentStatus=pending"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(find).toHaveBeenCalledWith({ status: "confirmed", paymentStatus: "pending" });
    expect(countDocuments).toHaveBeenCalledWith({ status: "confirmed", paymentStatus: "pending" });
    expect(body).toMatchObject({ success: true, total: 1, page: 1, limit: 50 });
  });

  it("rejects invalid filter values", async () => {
    const response = await GET(request("?paymentStatus=overdue"));

    expect(response.status).toBe(400);
    expect(find).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";

const validProductId = "64f100000000000000000001";

function request(body: unknown) {
  return {
    url: "http://localhost/api/admin/product-batches",
    json: vi.fn().mockResolvedValue(body),
  } as never;
}

async function loadRoute({ admin = { email: "admin@example.com" } }: { admin?: { email: string } | null } = {}) {
  vi.resetModules();

  const create = vi.fn().mockResolvedValue({
    populate: vi.fn().mockResolvedValue({ _id: "batch-1", title: "Featured" }),
  });
  const lean = vi.fn().mockResolvedValue([{ _id: "batch-1", title: "Featured", products: [] }]);
  const populate = vi.fn().mockReturnValue({ lean });
  const sort = vi.fn().mockReturnValue({ populate });
  const find = vi.fn().mockReturnValue({ sort });
  const findByIdAndUpdate = vi.fn().mockReturnValue({
    populate: vi.fn().mockResolvedValue({ _id: "batch-1", title: "Updated" }),
  });
  const findByIdAndDelete = vi.fn().mockResolvedValue({ _id: "batch-1" });
  const updateMany = vi.fn().mockResolvedValue({});

  vi.doMock("@/lib/require-admin", () => ({ requireAdmin: vi.fn().mockResolvedValue(admin) }));
  vi.doMock("@/lib/db", () => ({ connectToDatabase: vi.fn().mockResolvedValue(undefined) }));
  vi.doMock("@/lib/models/Product", () => ({ default: {} }));
  vi.doMock("@/lib/models/ProductBatch", () => ({
    default: {
      find,
      create,
      findByIdAndUpdate,
      findByIdAndDelete,
    },
  }));
  vi.doMock("@/lib/models/HomepageSettings", () => ({
    default: {
      updateMany,
    },
  }));

  const collectionRoute = await import("./route");
  const itemRoute = await import("./[id]/route");

  return { collectionRoute, itemRoute, create, find, findByIdAndUpdate, findByIdAndDelete, updateMany };
}

describe("admin product batch routes", () => {
  it("lists product batches", async () => {
    const { collectionRoute, find } = await loadRoute();

    const response = await collectionRoute.GET({ url: "http://localhost/api/admin/product-batches" } as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(find).toHaveBeenCalledWith({});
    expect(body).toMatchObject({ success: true, total: 1, page: 1 });
  });

  it("rejects unauthenticated creates", async () => {
    const { collectionRoute, create } = await loadRoute({ admin: null });

    const response = await collectionRoute.POST(request({ title: "Featured" }));

    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a product batch with ordered product ids", async () => {
    const { collectionRoute, create } = await loadRoute();

    const response = await collectionRoute.POST(request({
      title: "  Featured  ",
      description: "  Homepage picks  ",
      active: false,
      products: [validProductId, "invalid"],
    }));

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      title: "Featured",
      description: "Homepage picks",
      active: false,
      products: [expect.objectContaining({ _bsontype: "ObjectId" })],
    }));
  });

  it("updates product batch fields without forcing omitted fields", async () => {
    const { itemRoute, findByIdAndUpdate } = await loadRoute();

    const response = await itemRoute.PATCH(
      request({ active: false, products: [validProductId] }),
      { params: Promise.resolve({ id: "64f200000000000000000001" }) }
    );

    expect(response.status).toBe(200);
    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      "64f200000000000000000001",
      expect.objectContaining({ active: false, products: [expect.objectContaining({ _bsontype: "ObjectId" })] }),
      { new: true, runValidators: true }
    );
  });

  it("removes deleted batches from homepage settings", async () => {
    const { itemRoute, findByIdAndDelete, updateMany } = await loadRoute();

    const response = await itemRoute.DELETE(
      { url: "http://localhost/api/admin/product-batches/64f200000000000000000001" } as never,
      { params: Promise.resolve({ id: "64f200000000000000000001" }) }
    );

    expect(response.status).toBe(200);
    expect(findByIdAndDelete).toHaveBeenCalledWith("64f200000000000000000001");
    expect(updateMany).toHaveBeenCalledWith({}, expect.objectContaining({ $pull: expect.any(Object) }));
  });
});

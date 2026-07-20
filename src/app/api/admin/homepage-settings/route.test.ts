import { describe, expect, it, vi } from "vitest";

const firstBatchId = "64f100000000000000000001";
const secondBatchId = "64f100000000000000000002";

function putRequest(body: unknown) {
  return {
    url: "http://localhost/api/admin/homepage-settings",
    json: vi.fn().mockResolvedValue(body),
  } as never;
}

async function loadRoute() {
  vi.resetModules();

  const lean = vi.fn().mockResolvedValue({ key: "homepage", productBatches: [] });
  const populate = vi.fn().mockReturnValue({ lean });
  const findOneAndUpdate = vi.fn().mockReturnValue({ populate });

  vi.doMock("@/lib/require-admin", () => ({ requireAdmin: vi.fn().mockResolvedValue({ email: "admin@example.com" }) }));
  vi.doMock("@/lib/db", () => ({ connectToDatabase: vi.fn().mockResolvedValue(undefined) }));
  vi.doMock("@/lib/models/ProductBatch", () => ({ default: {} }));
  vi.doMock("@/lib/models/HomepageSettings", () => ({
    default: {
      findOneAndUpdate,
    },
  }));

  const route = await import("./route");
  return { route, findOneAndUpdate };
}

describe("admin homepage settings route", () => {
  it("saves selected batches in normalized order", async () => {
    const { route, findOneAndUpdate } = await loadRoute();

    const response = await route.PUT(putRequest({
      productBatches: [
        { batch: secondBatchId, enabled: false, order: 20 },
        { batch: "invalid", enabled: true, order: 1 },
        { batch: firstBatchId, enabled: true, order: 10 },
        { batch: firstBatchId, enabled: false, order: 0 },
      ],
    }));

    expect(response.status).toBe(200);
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { key: "homepage" },
      expect.objectContaining({
        $set: {
          productBatches: [
            expect.objectContaining({ enabled: true, order: 0 }),
            expect.objectContaining({ enabled: false, order: 1 }),
          ],
        },
      }),
      expect.objectContaining({ upsert: true, new: true })
    );
  });
});

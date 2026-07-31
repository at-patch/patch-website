import { beforeEach, describe, expect, it, vi } from "vitest";

const { zoneFindOne, cityFindOne } = vi.hoisted(() => ({
  zoneFindOne: vi.fn(),
  cityFindOne: vi.fn(),
}));

vi.mock("@/lib/models/ShippingZone", () => ({
  default: { findOne: zoneFindOne },
}));
vi.mock("@/lib/models/ShippingCity", () => ({
  default: { findOne: cityFindOne, find: vi.fn() },
}));
vi.mock("@/lib/models/Product", () => ({
  default: { find: vi.fn() },
}));

import { resolveShippingForWeight } from "./shipping-quote";

function leanResult(value: unknown) {
  return { lean: vi.fn().mockResolvedValue(value) };
}

describe("shipping rule resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cityFindOne.mockReturnValue(leanResult(null));
  });

  it("uses a Bangladesh district rule", async () => {
    zoneFindOne.mockReturnValue(leanResult({
      _id: "zone-bd",
      countryCode: "BD",
      countryName: "Bangladesh",
      scope: "district",
      district: "Dhaka",
      districtSlug: "dhaka",
      baseRate: 80,
      additionalKgRate: 30,
      currency: "BDT",
    }));

    const quote = await resolveShippingForWeight(
      { countryCode: "BD", districtSlug: "dhaka" },
      3.5
    );

    expect(zoneFindOne).toHaveBeenCalledWith({
      countryCode: "BD",
      scope: "district",
      districtSlug: "dhaka",
      isActive: true,
    });
    expect(quote).toMatchObject({
      totalWeightKg: 3.5,
      chargeableWeightKg: 4,
      shippingCost: 170,
      shippingRuleId: "zone-bd",
    });
  });

  it("uses one country-wide rule for an international destination", async () => {
    zoneFindOne.mockReturnValue(leanResult({
      _id: "zone-us",
      countryCode: "US",
      countryName: "United States",
      scope: "country",
      district: "",
      districtSlug: "",
      baseRate: 1800,
      additionalKgRate: 400,
      currency: "BDT",
    }));

    const quote = await resolveShippingForWeight({ countryCode: "us" }, 1.2);

    expect(zoneFindOne).toHaveBeenCalledWith({
      countryCode: "US",
      scope: "country",
      isActive: true,
    });
    expect(quote?.shippingCost).toBe(2200);
  });

  it("falls back to a legacy Bangladesh flat city rate", async () => {
    zoneFindOne.mockReturnValue(leanResult(null));
    cityFindOne.mockReturnValue(leanResult({
      _id: "city-1",
      name: "Dhaka",
      slug: "dhaka",
      shippingCost: 80,
    }));

    const quote = await resolveShippingForWeight(
      { countryCode: "BD", districtSlug: "dhaka" },
      3.5
    );

    expect(quote).toMatchObject({ chargeableWeightKg: 4, shippingCost: 80 });
    expect(quote?.destination.legacy).toBe(true);
  });
});

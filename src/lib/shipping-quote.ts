import CourierZoneModel from "@/lib/models/CourierZone";
import ProductModel from "@/lib/models/Product";
import ShippingCityModel from "@/lib/models/ShippingCity";
import ShippingZoneModel from "@/lib/models/ShippingZone";
import {
  getInternationalChargeableWeightKg,
  listAvailableCourierClasses,
  type CourierRateTier,
} from "@/lib/courier-shipping";
import { calculateWeightShipping } from "@/lib/shipping";
import type { CourierClass, ShippingDestination, ShippingQuote } from "@/types";

export interface ShippingDestinationInput {
  countryCode: string;
  districtSlug?: string;
  courierClass?: CourierClass;
}

type ResolvedShipping = ShippingQuote & {
  shippingRuleId?: string;
};

export async function listActiveShippingDestinations(): Promise<ShippingDestination[]> {
  const zones = await ShippingZoneModel.find({ isActive: true, currency: "BDT" })
    .sort({ countryName: 1, district: 1 })
    .lean();

  const destinations = zones.map((zone) => ({
      id: String(zone._id),
      countryCode: zone.countryCode,
      countryName: zone.countryName,
      scope: zone.scope,
      district: zone.district || undefined,
      districtSlug: zone.districtSlug || undefined,
      currency: zone.currency,
    }));

  const bdDistrictsReady = zones.some((zone) => zone.countryCode === "BD" && zone.scope === "district");
  const bangladeshDestinations = bdDistrictsReady
    ? destinations
    : [
        ...destinations,
        ...(await ShippingCityModel.find({ isActive: true }).sort({ name: 1 }).lean()).map((city) => ({
          id: String(city._id),
          countryCode: "BD",
          countryName: "Bangladesh",
          scope: "district" as const,
          district: city.name,
          districtSlug: city.slug,
          currency: "BDT",
          legacy: true,
        })),
      ];

  const courierZones = await CourierZoneModel.find({ isActive: true }).lean();
  const internationalDestinations = courierZones.flatMap((zone) =>
    zone.countries.map((country: { code: string; name: string }) => ({
      id: `${String(zone._id)}:${country.code}`,
      countryCode: country.code,
      countryName: country.name,
      scope: "country" as const,
      currency: zone.currency,
    }))
  );

  return [...bangladeshDestinations, ...internationalDestinations];
}

export async function resolveShippingForWeight(
  destination: ShippingDestinationInput,
  totalWeightKg: number
): Promise<ResolvedShipping | null> {
  const countryCode = destination.countryCode.trim().toUpperCase();
  const districtSlug = destination.districtSlug?.trim().toLowerCase() ?? "";
  const filter =
    countryCode === "BD"
      ? { countryCode: "BD", scope: "district", districtSlug, isActive: true }
      : { countryCode, scope: "country", isActive: true };

  const zone = await ShippingZoneModel.findOne(filter).lean();
  if (zone) {
    const calculated = calculateWeightShipping(totalWeightKg, {
      baseRate: zone.baseRate,
      additionalKgRate: zone.additionalKgRate,
    });
    return {
      ...calculated,
      shippingCost: calculated.shippingCost,
      currency: zone.currency,
      shippingRuleId: String(zone._id),
      destination: {
        id: String(zone._id),
        countryCode: zone.countryCode,
        countryName: zone.countryName,
        scope: zone.scope,
        district: zone.district || undefined,
        districtSlug: zone.districtSlug || undefined,
        currency: zone.currency,
      },
    };
  }

  if (countryCode === "BD" && districtSlug) {
    const legacyCity = await ShippingCityModel.findOne({ slug: districtSlug, isActive: true }).lean();
    if (legacyCity) {
      const calculated = calculateWeightShipping(totalWeightKg, {
        baseRate: legacyCity.shippingCost,
        additionalKgRate: 0,
      });
      return {
        ...calculated,
        currency: "BDT",
        destination: {
          id: String(legacyCity._id),
          countryCode: "BD",
          countryName: "Bangladesh",
          scope: "district",
          district: legacyCity.name,
          districtSlug: legacyCity.slug,
          currency: "BDT",
          legacy: true,
        },
      };
    }
  }

  if (countryCode !== "BD") {
    return resolveInternationalCourierShipping(countryCode, totalWeightKg, destination.courierClass);
  }

  return null;
}

async function resolveInternationalCourierShipping(
  countryCode: string,
  totalWeightKg: number,
  requestedClass?: CourierClass
): Promise<ResolvedShipping | null> {
  const zone = await CourierZoneModel.findOne({ "countries.code": countryCode, isActive: true }).lean();
  if (!zone) return null;

  const country = zone.countries.find((entry: { code: string; name: string }) => entry.code === countryCode);
  if (!country) return null;

  const availableClasses = listAvailableCourierClasses(zone.rates as CourierRateTier[], totalWeightKg);
  if (availableClasses.length === 0) return null;

  const chosen = requestedClass
    ? availableClasses.find((option) => option.courierClass === requestedClass)
    : availableClasses.reduce((cheapest, option) =>
        option.shippingCost < cheapest.shippingCost ? option : cheapest
      );
  if (!chosen) return null;

  const chargeableWeightKg = getInternationalChargeableWeightKg(totalWeightKg);

  return {
    totalWeightKg,
    chargeableWeightKg,
    shippingCost: chosen.shippingCost,
    currency: zone.currency,
    shippingRuleId: String(zone._id),
    courierClass: chosen.courierClass,
    availableClasses,
    destination: {
      id: `${String(zone._id)}:${country.code}`,
      countryCode: country.code,
      countryName: country.name,
      scope: "country",
      currency: zone.currency,
    },
  };
}

export async function quoteShippingForProducts(
  productIds: string[],
  destination: ShippingDestinationInput
) {
  const products = await ProductModel.find({ _id: { $in: productIds } })
    .select("_id weightKg")
    .lean();
  const weights = new Map(products.map((product) => [String(product._id), product.weightKg]));

  let totalWeightKg = 0;
  for (const productId of productIds) {
    const weight = weights.get(productId);
    if (!weight || weight <= 0) {
      throw new Error("One or more products do not have a valid shipping weight.");
    }
    totalWeightKg += weight;
  }

  return resolveShippingForWeight(destination, totalWeightKg);
}

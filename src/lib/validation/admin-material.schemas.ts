import { z } from "zod";

export const inventoryItemCreateSchema = z.object({
  image: z.url("Upload an inventory image."),
  fabricCode: z.string().trim().min(1, "Fabric code is required."),
  category: z.string().trim().min(1, "Category is required."),
  heightInches: z.number().min(0, "Height must be 0 or more."),
  widthInches: z.number().min(0, "Width must be 0 or more."),
  quantityPcs: z.number().int().min(0, "Quantity must be 0 or more."),
  description: z.string().trim().optional(),
  productTags: z.array(z.string().trim().min(1)).optional(),
});

export const inventoryItemUpdateSchema = inventoryItemCreateSchema.partial();

export const patternCreateSchema = z.object({
  patternImage: z.url("Upload a pattern image."),
  fabricCode: z.string().trim().min(1, "Fabric code is required."),
  sampleCode: z.string().trim().optional(),
  fabAmount1: z.string().trim().min(1, "Fab-Amount 1 is required."),
  fabricAmount2: z.string().trim().min(1, "Fabric Amount 2 is required."),
  size1: z.number().min(0, "Size 1 must be 0 or more."),
  size2: z.number().min(0, "Size 2 must be 0 or more."),
  productTags: z.array(z.string().trim().min(1)).optional(),
  inventoryTags: z.array(z.string().trim().min(1)).optional(),
});

export const patternUpdateSchema = patternCreateSchema.partial();

export const shippingCityCreateSchema = z.object({
  name: z.string().trim().min(1, "City name is required."),
  division: z.string().trim().optional(),
  shippingCost: z.number().min(0, "Shipping cost must be 0 or more."),
  isActive: z.boolean().optional(),
});

export const shippingCityUpdateSchema = shippingCityCreateSchema.partial();

const shippingZoneSchemaBase = z.object({
    countryCode: z.string().trim().length(2, "Use a two-letter country code.").transform((value) => value.toUpperCase()),
    countryName: z.string().trim().min(1, "Country name is required."),
    scope: z.enum(["country", "district"]),
    district: z.string().trim().optional(),
    baseRate: z.number().min(0, "Base rate must be 0 or more."),
    additionalKgRate: z.number().min(0, "Additional kg rate must be 0 or more."),
    currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("BDT"),
    isActive: z.boolean().optional(),
  });

export const shippingZoneCreateSchema = shippingZoneSchemaBase.superRefine((value, ctx) => {
    if (value.scope === "district" && !value.district) {
      ctx.addIssue({ code: "custom", path: ["district"], message: "District is required." });
    }
    if (value.scope === "country" && value.countryCode === "BD") {
      ctx.addIssue({
        code: "custom",
        path: ["scope"],
        message: "Bangladesh shipping must use district rules.",
      });
    }
  });

export const shippingZoneUpdateSchema = shippingZoneSchemaBase.partial().superRefine((value, ctx) => {
  if (value.scope === "district" && value.district === "") {
    ctx.addIssue({ code: "custom", path: ["district"], message: "District is required." });
  }
  if (value.scope === "country" && value.countryCode === "BD") {
    ctx.addIssue({
      code: "custom",
      path: ["scope"],
      message: "Bangladesh shipping must use district rules.",
    });
  }
});

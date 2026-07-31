import { z } from "zod";
import { SIZES } from "@/lib/constants";

const optionalImageUrlSchema = z.union([z.url("Upload a valid image."), z.literal("")]).optional();

const productVariantSchema = z.object({
  size: z.enum(SIZES),
  color: z.string().trim().min(1, "Variant color is required."),
  quantity: z.number().int().min(0, "Variant quantity must be 0 or more."),
});

const productSchemaBase = z.object({
    sku: z.string().trim().min(1, "SKU is required."),
    name: z.string().trim().min(1, "Name is required."),
    slug: z.string().trim().min(1, "Slug is required."),
    description: z.string().trim().min(1, "Description is required."),
    story: z.string().trim().optional(),
    images: z.array(z.url("Upload valid product images.")).optional(),
    sizeChartImage: optionalImageUrlSchema,
    price: z.number().min(0, "Price must be 0 or more."),
    currency: z.string().trim().length(3).optional(),
    weightKg: z.number().positive("Weight must be greater than 0 kg."),
    category: z.string().trim().min(1, "Category is required."),
    materials: z.array(z.string().trim().min(1)).optional(),
    rarity: z.enum(["one-of-one", "multi-quantity"]),
    size: z.enum(SIZES).optional(),
    variants: z.array(productVariantSchema).optional(),
    batchLabel: z.string().trim().optional(),
    status: z.enum(["available", "reserved", "sold", "archived"]).optional(),
    sourceInventoryItem: z.string().trim().optional(),
  });

export const productCreateSchema = productSchemaBase.superRefine((value, ctx) => {
    if (value.rarity === "multi-quantity" && (value.variants?.length ?? 0) === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Add at least one size/color variant.",
      });
    }
  });

export const productUpdateSchema = productSchemaBase.partial().superRefine((value, ctx) => {
  if (value.rarity === "multi-quantity" && value.variants?.length === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["variants"],
      message: "Add at least one size/color variant.",
    });
  }
});

import { z } from "zod";

const promoSchema = z.object({
  eyebrow: z.string().trim().min(1),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  ctaLabel: z.string().trim().min(1),
  ctaHref: z.string().trim().min(1),
});

export const homepageSettingsUpdateSchema = z.object({
  primaryPromo: promoSchema.optional(),
  secondaryPromo: promoSchema.optional(),
  productBatches: z.array(z.unknown()).optional(),
});

export const aboutSettingsUpdateSchema = z.object({
  eyebrow: z.string().trim().min(1),
  heroTitle: z.string().trim().min(1),
  narratives: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        body: z.string().trim().min(1),
        image: z.string().trim().optional(),
      })
    )
    .min(1),
});

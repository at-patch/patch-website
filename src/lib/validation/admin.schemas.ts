import { z } from "zod";

export const createAdminSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["owner", "staff"]).default("staff"),
});

// Only fields an owner may change about another admin — password is
// intentionally omitted (that's a self-service reset flow, not admin-edit).
export const updateAdminSchema = z
  .object({
    name: z.string().trim().min(1),
    role: z.enum(["owner", "staff"]),
    active: z.boolean(),
  })
  .partial();

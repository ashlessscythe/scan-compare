import { z } from "zod";

export const DEFAULT_SITE_SLUG = "default";

export const siteSlugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens");

export const createSiteSchema = z.object({
  name: z.string().min(1),
  slug: siteSlugSchema,
});

export const updateSiteSchema = z.object({
  name: z.string().min(1).optional(),
  slug: siteSlugSchema.optional(),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;

/** Default AppSettings payload for a newly created site (matches seed defaults). */
export function defaultAppSettingsData(siteId: string, adminPinHash: string) {
  return {
    siteId,
    adminPinHash,
    emailFromName: "Tesla Scan",
    emailFromAddress: "no-reply@example.com",
    emailCcList: ["cc@example.com"],
    lockTimeoutMinutes: 30,
  };
}

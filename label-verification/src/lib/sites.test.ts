import { describe, expect, it } from "vitest";
import { createSiteSchema, siteSlugSchema, updateSiteSchema } from "./sites";

describe("siteSlugSchema", () => {
  it("accepts valid slugs", () => {
    expect(siteSlugSchema.parse("default")).toBe("default");
    expect(siteSlugSchema.parse("warehouse-b")).toBe("warehouse-b");
    expect(siteSlugSchema.parse("site123")).toBe("site123");
  });

  it("rejects invalid slugs", () => {
    expect(() => siteSlugSchema.parse("")).toThrow();
    expect(() => siteSlugSchema.parse("Warehouse-B")).toThrow();
    expect(() => siteSlugSchema.parse("site_b")).toThrow();
    expect(() => siteSlugSchema.parse("-leading")).toThrow();
    expect(() => siteSlugSchema.parse("trailing-")).toThrow();
    expect(() => siteSlugSchema.parse("double--hyphen")).toThrow();
  });
});

describe("createSiteSchema", () => {
  it("requires name and slug", () => {
    const result = createSiteSchema.safeParse({ name: "Warehouse C", slug: "warehouse-c" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createSiteSchema.safeParse({ name: "", slug: "warehouse-c" });
    expect(result.success).toBe(false);
  });
});

describe("updateSiteSchema", () => {
  it("allows partial updates", () => {
    expect(updateSiteSchema.safeParse({ name: "New Name" }).success).toBe(true);
    expect(updateSiteSchema.safeParse({ slug: "new-slug" }).success).toBe(true);
    expect(updateSiteSchema.safeParse({}).success).toBe(true);
  });
});

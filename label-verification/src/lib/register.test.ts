import { describe, expect, it } from "vitest";
import { normalizeRegisterEmail, registerSchema } from "./register";

describe("registerSchema", () => {
  it("accepts a valid signup payload", () => {
    const parsed = registerSchema.safeParse({
      email: "new.user@example.com",
      name: "New User",
      password: "password1",
    });
    expect(parsed.success).toBe(true);
  });

  it("requires an email and password of at least 8 characters", () => {
    expect(registerSchema.safeParse({ email: "bad", password: "short" }).success).toBe(false);
    expect(
      registerSchema.safeParse({ email: "ok@example.com", password: "short" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ email: "ok@example.com", password: "longenough" }).success,
    ).toBe(true);
  });

  it("allows omitting name", () => {
    const parsed = registerSchema.safeParse({
      email: "ok@example.com",
      password: "longenough",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("normalizeRegisterEmail", () => {
  it("lowercases email for storage and lookup", () => {
    expect(normalizeRegisterEmail("Admin@Example.COM")).toBe("admin@example.com");
  });
});

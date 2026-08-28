import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  SESSION_INVALIDATED_ERROR,
  isSessionInvalidated,
  validateSessionVersion,
} from "./session-version";

const findUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
  },
}));

describe("validateSessionVersion", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("returns token unchanged when id is missing", async () => {
    const token = { sessionVersion: 1 };
    await expect(validateSessionVersion(token)).resolves.toEqual(token);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("marks token invalid when DB version differs", async () => {
    findUnique.mockResolvedValue({ sessionVersion: 2 });
    const result = await validateSessionVersion({ id: "u1", sessionVersion: 1 });
    expect(result.error).toBe(SESSION_INVALIDATED_ERROR);
  });

  it("keeps token valid when versions match", async () => {
    findUnique.mockResolvedValue({ sessionVersion: 3 });
    const result = await validateSessionVersion({ id: "u1", sessionVersion: 3 });
    expect(result.error).toBeUndefined();
  });

  it("marks token invalid when user is missing", async () => {
    findUnique.mockResolvedValue(null);
    const result = await validateSessionVersion({ id: "u1", sessionVersion: 0 });
    expect(result.error).toBe(SESSION_INVALIDATED_ERROR);
  });
});

describe("isSessionInvalidated", () => {
  it("detects invalidated sessions", () => {
    expect(isSessionInvalidated(SESSION_INVALIDATED_ERROR)).toBe(true);
    expect(isSessionInvalidated(undefined)).toBe(false);
  });
});

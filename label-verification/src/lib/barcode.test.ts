import { describe, expect, it } from "vitest";
import {
  extractLicensePlateShort,
  extractPartNumber,
  isValidLargeQr,
  isValidSmallQr,
  normalizeScanInput,
  validateLargeQrScans,
  validateSmallQrPair,
} from "./barcode";

const QR_ORIG =
  "[)>+06:6J0001153522305290204228337:P12345678-00-C:Q120:K7700012394:5K1:4K180:3QEA:1T:15D20240528:99Z04228337+#";
const QR_NEW =
  "[)>+06:6J9999999999999999999999999:P12345678-00-C:Q120:K7700012394:5K1:4K180:3QEA:1T:15D20240528:99Z04228337+#";
const QR_NEW_DIFF_PN =
  "[)>+06:6J0001153522305290204228337:P87654321-00-C:Q120:K7700012394:5K1:4K180:3QEA:1T:15D20240528:99Z04228337+#";

const LIC_PLATES: [string, string, string, string] = [
  "6J0001153522305290204228337:ZA",
  "6J0001153522305290204228337:ZB",
  "6J0001153522305290204228337:ZC",
  "6J0001153522305290204228337:ZD",
];

describe("normalizeScanInput", () => {
  it("trims whitespace and scanner suffixes", () => {
    expect(normalizeScanInput("  abc\r\n")).toBe("abc");
  });
});

describe("small QR validation", () => {
  it("detects valid small QR", () => {
    expect(isValidSmallQr(QR_ORIG)).toBe(true);
  });

  it("extracts part number", () => {
    expect(extractPartNumber(QR_ORIG)).toBe("12345678-00-C");
  });

  it("validates matching pair", () => {
    const result = validateSmallQrPair(QR_ORIG, QR_NEW);
    expect(result.valid).toBe(true);
    expect(result.code).toBe("OK");
  });

  it("rejects mismatched part numbers", () => {
    const result = validateSmallQrPair(QR_ORIG, QR_NEW_DIFF_PN);
    expect(result.valid).toBe(false);
  });

  it("rejects duplicate scans", () => {
    const result = validateSmallQrPair(QR_ORIG, QR_ORIG);
    expect(result.valid).toBe(false);
  });
});

describe("large QR validation", () => {
  it("detects valid large QR", () => {
    expect(isValidLargeQr(LIC_PLATES[0])).toBe(true);
  });

  it("extracts license plate short", () => {
    // Matches Python regex (?<=[6J|1J]).+?(?=:Z) behavior
    expect(extractLicensePlateShort(LIC_PLATES[0])).toBe("J0001153522305290204228337");
  });

  it("validates four unique matching scans", () => {
    const result = validateLargeQrScans(LIC_PLATES);
    expect(result.valid).toBe(true);
  });

  it("rejects repeated scans", () => {
    const result = validateLargeQrScans([
      LIC_PLATES[0],
      LIC_PLATES[0],
      LIC_PLATES[2],
      LIC_PLATES[3],
    ]);
    expect(result.valid).toBe(false);
  });
});

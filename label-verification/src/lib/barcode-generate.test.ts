import { describe, expect, it } from "vitest";
import {
  buildLargeQrLabels,
  buildPalletScan,
  buildSmallQr,
  generateLicensePlate,
  generatePartNumber,
} from "./barcode-generate";
import {
  extractPartNumber,
  validateLargeQrScans,
  validateSmallQrPair,
} from "./barcode";

describe("barcode-generate", () => {
  it("generates deterministic license plates", () => {
    expect(generateLicensePlate(42)).toBe(generateLicensePlate(42));
    expect(generateLicensePlate(42)).toHaveLength(25);
  });

  it("builds valid small QR strings", () => {
    const license = generateLicensePlate(1);
    const qr = buildSmallQr({
      licensePlate: license,
      partNumber: generatePartNumber(0),
      serial: "K7700014848",
    });
    expect(extractPartNumber(qr)).toBe("1507971-05-G");
  });

  it("builds valid large QR label sets", () => {
    const license = generateLicensePlate(5);
    const labels = buildLargeQrLabels(license);
    const result = validateLargeQrScans(labels);
    expect(result.valid).toBe(true);
  });

  it("buildPalletScan produces valid small and large QR pairs", () => {
    const scan = buildPalletScan(100);
    const small = validateSmallQrPair(scan.qrOrig, scan.qrNew);
    const large = validateLargeQrScans([scan.scan1, scan.scan2, scan.scan3, scan.scan4]);

    expect(small.valid).toBe(true);
    expect(large.valid).toBe(true);
    expect(scan.pnOrig).toBe(scan.pnNew);
    expect(scan.result).toBe("Barcodes are unique. License plates on new labels match.");
  });

  it("reference pallets match real example structure", () => {
    const pallet1 = buildPalletScan(0, { useReference: 0 });
    const pallet2 = buildPalletScan(0, { useReference: 1 });

    expect(pallet1.pnOrig).toBe("1507971-05-G");
    expect(pallet2.pnOrig).toBe("1109003-00-F");
    expect(validateSmallQrPair(pallet1.qrOrig, pallet1.qrNew).valid).toBe(true);
    expect(validateSmallQrPair(pallet2.qrOrig, pallet2.qrNew).valid).toBe(true);
  });

  it("produces distinct scans for different seeds", () => {
    const a = buildPalletScan(1);
    const b = buildPalletScan(2);
    expect(a.qrOrig).not.toBe(b.qrOrig);
  });
});

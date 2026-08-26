export type ValidationResult = {
  valid: boolean;
  code: "OK" | "ERROR";
  message: string;
};

export function normalizeScanInput(raw: string): string {
  if (!raw) return "";
  return raw.replace(/[\r\n\t]+$/g, "").trim();
}

export function isValidSmallQr(barcode: string): boolean {
  return normalizeScanInput(barcode).includes(":P");
}

export function isValidLargeQr(barcode: string): boolean {
  return normalizeScanInput(barcode).includes(":Z");
}

export function extractPartNumber(barcode: string): string | null {
  const normalized = normalizeScanInput(barcode);
  const match = normalized.match(/(?<=:P).+?(?=:Q)/);
  return match?.[0] ?? null;
}

export function extractLicensePlate(barcode: string): string | null {
  const normalized = normalizeScanInput(barcode);
  const match = normalized.match(/(?<=(:6J|:1J)).+?(?=:P)/);
  return match?.[0] ?? null;
}

export function extractLicensePlateShort(barcode: string): string | null {
  const normalized = normalizeScanInput(barcode);
  const match = normalized.match(/(?<=[6J|1J]).+?(?=:Z)/);
  return match?.[0] ?? null;
}

/** Suffix letter after `:Z` on a large QR (expected A–D). */
export function extractLargeQrSuffix(barcode: string): string | null {
  const normalized = normalizeScanInput(barcode);
  const match = normalized.match(/:Z([A-D])(?:[^A-Za-z0-9]|$)/i);
  return match?.[1]?.toUpperCase() ?? null;
}

export function validateSmallQrPair(orig: string, portal: string): ValidationResult {
  const o = normalizeScanInput(orig);
  const p = normalizeScanInput(portal);

  if (!o || !p) {
    return { valid: false, code: "ERROR", message: "Please scan 2 barcodes" };
  }

  if (o === p) {
    return { valid: false, code: "ERROR", message: "Same barcode scanned twice" };
  }

  if (!isValidSmallQr(o) || !isValidSmallQr(p)) {
    return { valid: false, code: "ERROR", message: "Invalid Barcode" };
  }

  const pnOrig = extractPartNumber(o);
  const pnNew = extractPartNumber(p);

  if (!pnOrig || !pnNew || pnOrig !== pnNew) {
    return { valid: false, code: "ERROR", message: "Part numbers do not match" };
  }

  return {
    valid: true,
    code: "OK",
    message: "Ok: Part number matches, Barcodes are valid",
  };
}

const LARGE_QR_SUFFIXES = ["A", "B", "C", "D"] as const;

export function validateLargeQrScans(
  scans: [string, string, string, string],
): ValidationResult {
  const normalized = scans.map(normalizeScanInput) as [string, string, string, string];
  const unique = new Set(normalized);

  if (normalized.some((s) => !s)) {
    return { valid: false, code: "ERROR", message: "Need 4 valid scans." };
  }

  if (unique.size !== 4) {
    return { valid: false, code: "ERROR", message: "Repeat barcodes. Need 4 different labels." };
  }

  const valid = normalized.filter(isValidLargeQr);
  if (valid.length !== 4) {
    return { valid: false, code: "ERROR", message: "Invalid Barcodes scanned." };
  }

  const licenses = valid.map(extractLicensePlateShort).filter(Boolean) as string[];
  if (licenses.length !== 4 || new Set(licenses).size !== 1) {
    return { valid: false, code: "ERROR", message: "License plates mismatch." };
  }

  const suffixes = normalized.map(extractLargeQrSuffix);
  const suffixSet = new Set(suffixes);
  if (
    suffixes.some((s) => !s) ||
    suffixSet.size !== 4 ||
    !LARGE_QR_SUFFIXES.every((s) => suffixSet.has(s))
  ) {
    return {
      valid: false,
      code: "ERROR",
      message: "Need suffixes A, B, C, and D — one of each (any order).",
    };
  }

  return {
    valid: true,
    code: "OK",
    message: "Barcodes are unique. License plates on new labels match.",
  };
}

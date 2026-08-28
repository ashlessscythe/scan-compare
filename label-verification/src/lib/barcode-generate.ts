import {
  extractPartNumber,
  validateLargeQrScans,
  validateSmallQrPair,
} from "./barcode";

const SMALL_QR_PREFIX = "[)>+06:6J";

const PART_NUMBER_POOL = [
  "1507971-05-G",
  "1109003-00-F",
  "1208456-02-A",
  "1312044-01-D",
  "1421567-03-C",
  "1532901-04-B",
  "1643012-06-E",
  "1754123-07-H",
];

/** Deterministic numeric string for reproducible demo data. */
export function deterministicDigits(seed: number, length: number): string {
  let state = (seed ^ 0x9e3779b9) >>> 0;
  let result = "";
  for (let i = 0; i < length; i++) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    result += String(state % 10);
  }
  return result;
}

export function randomDigits(n: number): string {
  let result = "";
  for (let i = 0; i < n; i++) {
    result += String(Math.floor(Math.random() * 10));
  }
  return result;
}

export function generatePartNumber(index = 0): string {
  const base = PART_NUMBER_POOL[index % PART_NUMBER_POOL.length];
  if (index < PART_NUMBER_POOL.length) return base;

  const cycle = Math.floor(index / PART_NUMBER_POOL.length);
  const [core, rev, suffix] = base.split("-");
  const bumped = String(Number(core) + cycle * 111).padStart(7, "0");
  return `${bumped}-${rev}-${suffix}`;
}

export function generateSerial(index = 0): string {
  return `K77000${String(14848 + index).padStart(5, "0")}`;
}

/** 25-digit license plate (10 + 15) used between :6J and :P in small QR codes. */
export function generateLicensePlate(seed: number): string {
  return deterministicDigits(seed, 10) + deterministicDigits(seed + 17, 15);
}

export type SmallQrParams = {
  licensePlate: string;
  partNumber: string;
  serial: string;
  weight?: string;
  zCode?: string;
};

export function buildSmallQr({
  licensePlate,
  partNumber,
  serial,
  weight = "190",
  zCode,
}: SmallQrParams): string {
  const z = zCode ?? deterministicDigits(partNumber.length + serial.length, 8);
  return `${SMALL_QR_PREFIX}${licensePlate}:P${partNumber}:Q120:K${serial}:5K:4K${weight}:3QEA:1T:15D:12D:99Z${z}:S:X0+#`;
}

export function buildLargeQrLabels(
  portalLicensePlate: string,
): [string, string, string, string] {
  const base = `6J${portalLicensePlate}`;
  return [`${base}:ZA`, `${base}:ZB`, `${base}:ZC`, `${base}:ZD`];
}

export type PalletScanData = {
  qrOrig: string;
  qrNew: string;
  pnOrig: string;
  pnNew: string;
  scan1: string;
  scan2: string;
  scan3: string;
  scan4: string;
  result: string;
};

/** Fixed pallet templates mirroring real scan structure (shipment 12345679, pallets 1–2). */
const REFERENCE_PALLETS: Array<{
  qrOrig: string;
  qrNew: string;
  weight: string;
}> = [
  {
    qrOrig:
      "[)>+06:6J0001153522608221642527933:P1507971-05-G:Q120:K7700014848:5K:4K190:3QEA:1T:15D:12D:99Z85289711:S:X0+#",
    qrNew:
      "[)>+06:6J0001153522608221642527829:P1507971-05-G:Q120:K7700014848:5K:4K190:3QEA:1T:15D:12D:99Z85289711:S:X0+#",
    weight: "190",
  },
  {
    qrOrig:
      "[)>+06:6J0001153522608221657459368:P1109003-00-F:Q120:K7700019589:5K:4K20:3QEA:1T:15D:12D:99Z85289715:S:X0+#",
    qrNew:
      "[)>+06:6J0001153522608221657459499:P1109003-00-F:Q120:K7700019589:5K:4K20:3QEA:1T:15D:12D:99Z85289715:S:X0+#",
    weight: "20",
  },
];

function buildFromReference(index: 0 | 1): PalletScanData {
  const ref = REFERENCE_PALLETS[index];
  const portalLicense = ref.qrNew.match(/(?<=:6J).+?(?=:P)/)?.[0];
  if (!portalLicense) throw new Error("Invalid reference pallet QR");

  const [scan1, scan2, scan3, scan4] = buildLargeQrLabels(portalLicense);
  const largeResult = validateLargeQrScans([scan1, scan2, scan3, scan4]);

  return {
    qrOrig: ref.qrOrig,
    qrNew: ref.qrNew,
    pnOrig: extractPartNumber(ref.qrOrig)!,
    pnNew: extractPartNumber(ref.qrNew)!,
    scan1,
    scan2,
    scan3,
    scan4,
    result: largeResult.message,
  };
}

/**
 * Build a complete valid pallet scan. Seed should combine shipment and pallet indices
 * for deterministic output across re-seeds.
 */
export function buildPalletScan(seed: number, options?: { useReference?: 0 | 1 }): PalletScanData {
  if (options?.useReference !== undefined) {
    return buildFromReference(options.useReference);
  }

  const origLicense = generateLicensePlate(seed * 2 + 1);
  let portalLicense = generateLicensePlate(seed * 2 + 2);
  if (portalLicense === origLicense) {
    portalLicense = generateLicensePlate(seed * 2 + 3);
  }

  const partNumber = generatePartNumber(seed);
  const serial = generateSerial(seed);
  const weight = String(20 + (seed % 17) * 10);

  const qrOrig = buildSmallQr({
    licensePlate: origLicense,
    partNumber,
    serial,
    weight,
    zCode: deterministicDigits(seed, 8),
  });
  const qrNew = buildSmallQr({
    licensePlate: portalLicense,
    partNumber,
    serial,
    weight,
    zCode: deterministicDigits(seed + 99, 8),
  });

  const smallResult = validateSmallQrPair(qrOrig, qrNew);
  if (!smallResult.valid) {
    throw new Error(`Generated invalid small QR pair: ${smallResult.message}`);
  }

  const [scan1, scan2, scan3, scan4] = buildLargeQrLabels(portalLicense);
  const largeResult = validateLargeQrScans([scan1, scan2, scan3, scan4]);
  if (!largeResult.valid) {
    throw new Error(`Generated invalid large QR scans: ${largeResult.message}`);
  }

  return {
    qrOrig,
    qrNew,
    pnOrig: extractPartNumber(qrOrig)!,
    pnNew: extractPartNumber(qrNew)!,
    scan1,
    scan2,
    scan3,
    scan4,
    result: largeResult.message,
  };
}

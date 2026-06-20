const allowSeedData = process.env.EXPO_PUBLIC_SHOW_SEED_DATA === "true";

const decode = (value: string) => {
  if (typeof atob === "function") return atob(value);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  let buffer = 0;
  let bits = 0;

  for (const char of value.replace(/=+$/, "")) {
    const index = chars.indexOf(char);
    if (index < 0) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
};

const seededMachineCodes = new Set(["Q05DLTAx", "QVNNLTA0", "Q1VULTA5", "UEtHLTA3", "UFJTLTAy"].map(decode));
const seededOrderNumbers = new Set(["UE8tMjYwNjEzLTAwMQ==", "UE8tMjYwNjEzLTAwMg==", "UE8tMjYwNjEzLTAwMw=="].map(decode));
const seededSkus = new Set(["Uk0tU1RMLThNTQ==", "U1AtQlJHLTYyMDU=", "UEtHLUNSVC1N", "RkctVkxWLTE4"].map(decode));

type SeedRecord = {
  machine_code?: unknown;
  order_number?: unknown;
  sku?: unknown;
};

export const stripSeedData = <T>(area: "machines" | "orders" | "inventory" | "quality" | "maintenance" | "finance", rows: T): T => {
  if (allowSeedData || !Array.isArray(rows)) return rows;

  if (area === "machines") {
    return rows.filter((row: SeedRecord) => !seededMachineCodes.has(String(row.machine_code || ""))) as T;
  }

  if (area === "orders") {
    return rows.filter((row: SeedRecord) => !seededOrderNumbers.has(String(row.order_number || ""))) as T;
  }

  if (area === "quality") {
    return rows.filter((row: SeedRecord & { order?: SeedRecord }) => !seededOrderNumbers.has(String(row.order?.order_number || ""))) as T;
  }

  if (area === "maintenance") {
    return rows.filter((row: SeedRecord & { machine?: SeedRecord }) => !seededMachineCodes.has(String(row.machine?.machine_code || ""))) as T;
  }

  if (area === "finance") {
    return [] as T;
  }

  return rows.filter((row: SeedRecord) => !seededSkus.has(String(row.sku || ""))) as T;
};

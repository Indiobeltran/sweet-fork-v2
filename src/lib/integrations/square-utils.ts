import { createHash } from "node:crypto";

export function squareIdempotencyKey(...parts: string[]) {
  const digest = createHash("sha256").update(parts.join(":")).digest("hex");
  return `sf-${digest.slice(0, 32)}`;
}

export function moneyToCents(value: number) {
  if (!Number.isFinite(value) || value < 0) throw new Error("invalid-money");
  return Math.round((value + Number.EPSILON) * 100);
}

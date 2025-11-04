import type { BrandedRlp } from "./BrandedRlp.js";
import { isData } from "./isData.js";

/**
 * Check if value is bytes Data
 */
export function isBytesData(value: unknown): value is BrandedRlp & { type: "bytes" } {
	return isData(value) && value.type === "bytes";
}

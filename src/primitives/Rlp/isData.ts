import type { BrandedRlp } from "./BrandedRlp.js";

/**
 * Check if value is RLP Data structure
 */
export function isData(value: unknown): value is BrandedRlp {
	return (
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		"value" in value &&
		(value.type === "bytes" || value.type === "list")
	);
}

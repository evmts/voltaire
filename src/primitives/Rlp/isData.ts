import type { Data } from "./Rlp.js";

/**
 * Check if value is RLP Data structure
 */
export function isData(value: unknown): value is Data {
	return (
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		"value" in value &&
		(value.type === "bytes" || value.type === "list")
	);
}

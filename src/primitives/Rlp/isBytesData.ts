import type { Data } from "./Rlp.js";
import { isData } from "./isData.js";

/**
 * Check if value is bytes Data
 */
export function isBytesData(value: unknown): value is Data & { type: "bytes" } {
	return isData(value) && value.type === "bytes";
}

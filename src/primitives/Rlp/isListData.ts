import type { Data } from "./Rlp.js";
import { isData } from "./isData.js";

/**
 * Check if value is list Data
 */
export function isListData(value: unknown): value is Data & { type: "list" } {
	return isData(value) && value.type === "list";
}

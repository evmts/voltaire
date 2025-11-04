import type { BrandedRlp } from "./BrandedRlp.js";
import { isData } from "./isData.js";

/**
 * Check if value is list Data
 */
export function isListData(value: unknown): value is BrandedRlp & { type: "list" } {
	return isData(value) && value.type === "list";
}

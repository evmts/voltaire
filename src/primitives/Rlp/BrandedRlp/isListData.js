import { isData } from "./isData.js";

/**
 * Check if value is RLP list data
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isListData(value) {
	return isData(value) && value.type === "list";
}

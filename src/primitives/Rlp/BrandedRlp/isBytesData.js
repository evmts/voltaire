import { isData } from "./isData.js";

/**
 * Check if value is RLP bytes data
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isBytesData(value) {
	return isData(value) && value.type === "bytes";
}

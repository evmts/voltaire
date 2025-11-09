import { SIZE } from "./constants.js";

/**
 * Check if string is valid hash hex
 *
 * Returns false instead of throwing, useful for validation.
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if valid hash hex string
 *
 * @example
 * ```js
 * Hash.isValidHex('0x1234...'); // true or false
 * ```
 */
export function isValidHex(value) {
	if (typeof value !== "string") {
		return false;
	}
	const normalized = value.startsWith("0x") ? value.slice(2) : value;
	if (normalized.length !== SIZE * 2) {
		return false;
	}
	return /^[0-9a-fA-F]+$/.test(normalized);
}

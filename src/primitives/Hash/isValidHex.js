import { SIZE } from "./BrandedHash.js";

/**
 * Validate hex string is valid hash format
 *
 * @param {string} hex - Hex string to validate
 * @returns {boolean} True if valid hash hex format
 *
 * @example
 * ```js
 * if (Hash.isValidHex('0x1234...')) {
 *   const hash = Hash.fromHex('0x1234...');
 * }
 * ```
 */
export function isValidHex(hex) {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	return normalized.length === SIZE * 2 && /^[0-9a-fA-F]+$/.test(normalized);
}

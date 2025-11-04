import { SIZE } from "./BrandedHash.js";

/**
 * Check if value is a valid Hash
 *
 * @param {unknown} value - Value to check
 * @returns {value is import('./BrandedHash.js').BrandedHash} True if value is Hash type
 *
 * @example
 * ```js
 * if (Hash.isHash(value)) {
 *   // value is Hash
 * }
 * ```
 */
export function isHash(value) {
	return value instanceof Uint8Array && value.length === SIZE;
}

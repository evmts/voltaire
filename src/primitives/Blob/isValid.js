import { SIZE } from "./constants.js";

/**
 * Validate blob has correct size
 *
 * @param {Uint8Array} blob - Blob to validate
 * @returns {boolean} true if blob is exactly SIZE bytes
 *
 * @example
 * ```javascript
 * if (!Blob.isValid(blob)) {
 *   throw new Error("Invalid blob");
 * }
 * ```
 */
export function isValid(blob) {
	return blob.length === SIZE;
}

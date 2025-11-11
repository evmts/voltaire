import { SIZE } from "./constants.js";

/**
 * Validate blob has correct size
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {Uint8Array} blob - Blob to validate
 * @returns {boolean} true if blob is exactly SIZE bytes
 * @throws {never}
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * if (!Blob.isValid(blob)) {
 *   throw new Error("Invalid blob");
 * }
 * ```
 */
export function isValid(blob) {
	return blob.length === SIZE;
}

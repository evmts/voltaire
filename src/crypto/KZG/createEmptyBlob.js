import { BYTES_PER_BLOB } from "./constants.js";

/**
 * Create empty blob filled with zeros
 *
 * @returns {Uint8Array} New zero-filled blob
 *
 * @example
 * ```typescript
 * const blob = createEmptyBlob();
 * ```
 */
export function createEmptyBlob() {
	return new Uint8Array(BYTES_PER_BLOB);
}

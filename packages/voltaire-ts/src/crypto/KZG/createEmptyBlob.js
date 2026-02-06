import { BYTES_PER_BLOB } from "./constants.js";

/**
 * Create empty blob filled with zeros
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @returns {Uint8Array} New zero-filled blob
 * @throws {never}
 * @example
 * ```javascript
 * import { createEmptyBlob } from './crypto/KZG/index.js';
 * const blob = createEmptyBlob();
 * ```
 */
export function createEmptyBlob() {
	return new Uint8Array(BYTES_PER_BLOB);
}

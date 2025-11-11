import { fromBytes } from "./fromBytes.js";

/**
 * Create zero-filled hex of specific size
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {number} size - Size in bytes
 * @returns {import('./BrandedHex.js').BrandedHex} Zero-filled hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.zero(4); // '0x00000000'
 * ```
 */
export function zero(size) {
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (
		fromBytes(new Uint8Array(size))
	);
}

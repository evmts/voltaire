/**
 * Create Uint8 from Uint8Array (single byte)
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Uint8Array (must be exactly 1 byte)
 * @returns {import('./BrandedUint8.js').BrandedUint8} Uint8 value
 * @throws {Error} If bytes length is not 1
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const bytes = new Uint8Array([255]);
 * const value = Uint8.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== 1) {
		throw new Error(`Uint8 requires exactly 1 byte, got ${bytes.length}`);
	}

	return /** @type {import('./BrandedUint8.js').BrandedUint8} */ (bytes[0]);
}

/**
 * Create Uint16 from Uint8Array (2 bytes, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Uint8Array (must be exactly 2 bytes)
 * @returns {import('./BrandedUint16.js').BrandedUint16} Uint16 value
 * @throws {Error} If bytes length is not 2
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const bytes = new Uint8Array([0xff, 0xff]);
 * const value = Uint16.fromBytes(bytes); // 65535
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== 2) {
		throw new Error(`Uint16 requires exactly 2 bytes, got ${bytes.length}`);
	}

	const value = (bytes[0] << 8) | bytes[1];
	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (value);
}

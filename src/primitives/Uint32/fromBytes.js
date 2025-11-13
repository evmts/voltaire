import { SIZE } from "./constants.js";

/**
 * Create Uint32 from bytes (big-endian, 4 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - byte array (must be exactly 4 bytes)
 * @returns {import('./BrandedUint32.js').BrandedUint32} Uint32 value
 * @throws {Error} If bytes length is not 4
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const bytes = new Uint8Array([0, 0, 0, 255]);
 * const value = Uint32.fromBytes(bytes); // 255
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== SIZE) {
		throw new Error(`Uint32 bytes must be exactly ${SIZE} bytes, got ${bytes.length}`);
	}

	let value = 0;
	for (let i = 0; i < SIZE; i++) {
		value = (value << 8) | bytes[i];
	}

	return value >>> 0;
}

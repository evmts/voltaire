import { from } from "./from.js";

/**
 * Create Uint128 from bytes (big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Byte array (up to 16 bytes)
 * @returns {import('./BrandedUint128.js').BrandedUint128} Uint128 value
 * @throws {Error} If bytes length exceeds 16
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const bytes = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255]);
 * const value = Uint128.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length > 16) {
		throw new Error(`Uint128 bytes length exceeds 16: ${bytes.length}`);
	}

	let result = 0n;
	for (let i = 0; i < bytes.length; i++) {
		result = (result << 8n) | BigInt(bytes[i]);
	}

	return from(result);
}

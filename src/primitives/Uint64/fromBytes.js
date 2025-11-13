import { SIZE } from "./constants.js";

/**
 * Create Uint64 from bytes (big-endian, 8 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - byte array (must be exactly 8 bytes)
 * @returns {import('./BrandedUint64.js').BrandedUint64} Uint64 value
 * @throws {Error} If bytes length is not 8
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const bytes = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 255]);
 * const value = Uint64.fromBytes(bytes); // 255n
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== SIZE) {
		throw new Error(`Uint64 bytes must be exactly ${SIZE} bytes, got ${bytes.length}`);
	}

	let value = 0n;
	for (let i = 0; i < SIZE; i++) {
		value = (value << 8n) | BigInt(bytes[i]);
	}

	return value;
}

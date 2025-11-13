/**
 * Create Uint256 from bytes (big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - bytes to convert
 * @returns {import('./BrandedUint.js').BrandedUint} Uint256 value
 * @throws {Error} If bytes length exceeds 32
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const bytes = new Uint8Array([0xff, 0x00]);
 * const value = Uint256.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length > 32) {
		throw new Error(
			`Uint256 bytes cannot exceed 32 bytes, got ${bytes.length}`,
		);
	}

	let value = 0n;
	for (let i = 0; i < bytes.length; i++) {
		value = (value << 8n) | BigInt(bytes[i] ?? 0);
	}

	return value;
}

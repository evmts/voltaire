/**
 * Convert Uint256 to bytes (big-endian, 32 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to convert
 * @returns {Uint8Array} 32-byte Uint8Array
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const value = Uint256.from(255n);
 * const bytes = Uint256.toBytes(value);
 * ```
 */
export function toBytes(uint) {
	const bytes = new Uint8Array(32);
	let val = typeof uint === "bigint" ? uint : BigInt(uint);

	for (let i = 31; i >= 0; i--) {
		bytes[i] = Number(val & 0xffn);
		val = val >> 8n;
	}

	return bytes;
}

/**
 * Convert Uint128 to ABI-encoded bytes (32 bytes, padded)
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Uint128 value
 * @returns {Uint8Array} 32-byte ABI-encoded value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const value = Uint128.from(255n);
 * const encoded = Uint128.toAbiEncoded(value);
 * ```
 */
export function toAbiEncoded(uint) {
	const bytes = new Uint8Array(32);
	let val = typeof uint === "bigint" ? uint : BigInt(uint);

	// Fill from the end (big-endian, right-aligned in 32 bytes)
	for (let i = 31; i >= 16; i--) {
		bytes[i] = Number(val & 0xffn);
		val = val >> 8n;
	}

	return bytes;
}

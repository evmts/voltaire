/**
 * Convert Uint64 to ABI-encoded bytes (32 bytes, big-endian, left-padded with zeros)
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - Uint64 value to convert
 * @returns {Uint8Array} 32-byte Uint8Array
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const value = Uint64.from(255n);
 * const abiBytes = Uint64.toAbiEncoded(value);
 * ```
 */
export function toAbiEncoded(uint) {
	const bytes = new Uint8Array(32);
	let val = uint;

	for (let i = 31; i >= 24; i--) {
		bytes[i] = Number(val & 0xffn);
		val = val >> 8n;
	}

	return bytes;
}

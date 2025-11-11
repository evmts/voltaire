/**
 * Convert bigint to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {bigint} value - BigInt to convert
 * @param {number} [size] - Optional byte size for padding
 * @returns {import('./BrandedHex.js').BrandedHex} Hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.fromBigInt(255n);      // '0xff'
 * Hex.fromBigInt(255n, 32);  // '0x00...00ff' (32 bytes)
 * ```
 */
export function fromBigInt(value, size) {
	let hex = value.toString(16);
	if (size !== undefined) {
		hex = hex.padStart(size * 2, "0");
	}
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (`0x${hex}`);
}

/**
 * Options for toBigInt conversion
 * @typedef {Object} ToBigIntOptions
 * @property {boolean} [signed=false] - Interpret hex as two's complement signed value
 */

/**
 * Convert hex to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {import('./HexType.js').HexType} hex - Hex string to convert
 * @param {ToBigIntOptions} [options] - Conversion options
 * @returns {bigint} BigInt value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const num = Hex.toBigInt(hex); // 4660n
 *
 * // Signed interpretation (two's complement)
 * Hex.toBigInt('0xff', { signed: true }); // -1n
 * Hex.toBigInt('0x80', { signed: true }); // -128n
 * Hex.toBigInt('0x7f', { signed: true }); // 127n
 * ```
 */
export function toBigInt(hex, options) {
	const value = BigInt(hex);
	if (options?.signed) {
		// Calculate bit width from hex length (excluding 0x prefix)
		const hexDigits = hex.length - 2;
		const bitWidth = BigInt(hexDigits * 4);
		const maxSignedValue = 1n << (bitWidth - 1n);
		// If high bit is set, convert from two's complement
		if (value >= maxSignedValue) {
			return value - (1n << bitWidth);
		}
	}
	return value;
}

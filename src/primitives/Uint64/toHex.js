/**
 * Convert Uint64 to hex string (with 0x prefix)
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - Uint64 value to convert
 * @returns {string} hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const value = Uint64.from(255n);
 * const hex = Uint64.toHex(value); // "0xff"
 * ```
 */
export function toHex(uint) {
	return `0x${uint.toString(16)}`;
}

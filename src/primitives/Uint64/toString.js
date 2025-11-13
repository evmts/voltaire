/**
 * Convert Uint64 to string
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - Uint64 value to convert
 * @returns {string} decimal string representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const value = Uint64.from(255n);
 * const str = Uint64.toString(value); // "255"
 * ```
 */
export function toString(uint) {
	return uint.toString();
}

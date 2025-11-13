/**
 * Convert Uint64 to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - Uint64 value to convert
 * @returns {bigint} bigint value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const value = Uint64.from(255n);
 * const bigintValue = Uint64.toBigInt(value); // 255n
 * ```
 */
export function toBigInt(uint) {
	return uint;
}

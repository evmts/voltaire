/**
 * Convert Uint8 to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} uint - Uint8 value
 * @returns {bigint} bigint value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const value = Uint8.from(255);
 * const bigintValue = Uint8.toBigint(value); // 255n
 * ```
 */
export function toBigint(uint) {
	return BigInt(uint);
}

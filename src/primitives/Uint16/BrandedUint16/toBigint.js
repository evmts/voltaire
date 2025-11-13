/**
 * Convert Uint16 to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} uint - Uint16 value
 * @returns {bigint} bigint value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const value = Uint16.from(65535);
 * const bigintValue = Uint16.toBigint(value); // 65535n
 * ```
 */
export function toBigint(uint) {
	return BigInt(uint);
}

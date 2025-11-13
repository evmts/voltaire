/**
 * Convert Uint32 to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Uint32 value to convert
 * @returns {bigint} bigint value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const value = Uint32.from(255);
 * const bigintValue = Uint32.toBigInt(value); // 255n
 * ```
 */
export function toBigInt(uint) {
	return BigInt(uint);
}

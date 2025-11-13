/**
 * Convert Uint128 to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Uint128 value
 * @returns {bigint} BigInt value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const value = Uint128.from(255n);
 * const bigint = Uint128.toBigInt(value); // 255n
 * ```
 */
export function toBigInt(uint) {
	return uint;
}

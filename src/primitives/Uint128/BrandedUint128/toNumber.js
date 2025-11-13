/**
 * Convert Uint128 to number (warns on overflow)
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Uint128 value
 * @returns {number} Number value
 * @throws {Error} If value exceeds Number.MAX_SAFE_INTEGER
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const value = Uint128.from(255n);
 * const num = Uint128.toNumber(value); // 255
 * ```
 */
export function toNumber(uint) {
	if (uint > Number.MAX_SAFE_INTEGER) {
		throw new Error(
			`Uint128 value ${uint} exceeds Number.MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER})`,
		);
	}
	return Number(uint);
}

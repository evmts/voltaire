/**
 * Convert Uint256 to number
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to convert
 * @returns {number} number value
 * @throws {Error} If value exceeds MAX_SAFE_INTEGER
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const value = Uint256.from(255n);
 * const num = Uint256.toNumber(value);
 * ```
 */
export function toNumber(uint) {
	if (uint > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new Error(`Uint256 value exceeds MAX_SAFE_INTEGER: ${uint}`);
	}
	return Number(uint);
}

/**
 * Modulo operation
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Dividend
 * @param {import('./BrandedUint.js').BrandedUint} b - Divisor
 * @returns {import('./BrandedUint.js').BrandedUint} Remainder (uint % b)
 * @throws {Error} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(100n);
 * const b = Uint256.from(30n);
 * const remainder = Uint256.modulo(a, b); // 10n
 * ```
 */
export function modulo(uint, b) {
	if (b === 0n) {
		throw new Error("Modulo by zero");
	}
	return uint % b;
}

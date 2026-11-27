import { UintNegativeError } from "./errors.js";

/**
 * Subtract two Uint256 values with underflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * `minusChecked` is an explicit alias and `minusWrapping` wraps mod 2^256.
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - First operand
 * @param {import('./BrandedUint.js').BrandedUint} b - Second operand
 * @returns {import('./BrandedUint.js').BrandedUint} Difference (uint - b)
 * @throws {UintNegativeError} If the result is negative
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(100n);
 * const b = Uint256.from(50n);
 * const diff = Uint256.minus(a, b); // 50n
 * ```
 */
export function minus(uint, b) {
	if (uint < b) {
		throw new UintNegativeError(
			`Uint256 underflow: ${uint} - ${b} is negative`,
			{ value: uint - b, context: { a: uint, b, operation: "subtraction" } },
		);
	}
	return /** @type {import('./BrandedUint.js').BrandedUint} */ (uint - b);
}

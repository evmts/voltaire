import { MAX } from "./constants.js";
import { UintOverflowError } from "./errors.js";

/**
 * Multiply two Uint256 values with overflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * `timesChecked` is an explicit alias and `timesWrapping` wraps mod 2^256.
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - First operand
 * @param {import('./BrandedUint.js').BrandedUint} b - Second operand
 * @returns {import('./BrandedUint.js').BrandedUint} Product (uint * b)
 * @throws {UintOverflowError} If the result exceeds 2^256 - 1
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(10n);
 * const b = Uint256.from(5n);
 * const product = Uint256.times(a, b); // 50n
 * ```
 */
export function times(uint, b) {
	const product = uint * b;
	if (product > MAX) {
		throw new UintOverflowError(
			`Uint256 overflow: ${uint} * ${b} exceeds maximum (2^256 - 1)`,
			{ value: product, context: { a: uint, b, operation: "multiplication" } },
		);
	}
	return /** @type {import('./BrandedUint.js').BrandedUint} */ (product);
}

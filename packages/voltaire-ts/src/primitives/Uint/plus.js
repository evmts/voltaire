import { MAX } from "./constants.js";
import { UintOverflowError } from "./errors.js";

/**
 * Add two Uint256 values with overflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * `plusChecked` is an explicit alias and `plusWrapping` wraps mod 2^256.
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - First operand
 * @param {import('./BrandedUint.js').BrandedUint} b - Second operand
 * @returns {import('./BrandedUint.js').BrandedUint} Sum (uint + b)
 * @throws {UintOverflowError} If the result exceeds 2^256 - 1
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(100n);
 * const b = Uint256.from(50n);
 * const sum = Uint256.plus(a, b); // 150n
 * ```
 */
export function plus(uint, b) {
	const sum = uint + b;
	if (sum > MAX) {
		throw new UintOverflowError(
			`Uint256 overflow: ${uint} + ${b} exceeds maximum (2^256 - 1)`,
			{ value: sum, context: { a: uint, b, operation: "addition" } },
		);
	}
	return /** @type {import('./BrandedUint.js').BrandedUint} */ (sum);
}

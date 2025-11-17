import { MAX } from "./constants.js";

/**
 * Multiply Uint256 value with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - First operand
 * @param {import('./BrandedUint.js').BrandedUint} b - Second operand
 * @returns {import('./BrandedUint.js').BrandedUint} Product (uint * b) mod 2^256
 * @throws {never}
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
	return product & MAX;
}

import { MAX } from "./constants.js";

/**
 * Subtract Uint256 value with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - First operand
 * @param {import('./BrandedUint.js').BrandedUint} b - Second operand
 * @returns {import('./BrandedUint.js').BrandedUint} Difference (uint - b) mod 2^256
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(100n);
 * const b = Uint256.from(50n);
 * const diff = Uint256.minus(a, b); // 50n
 * ```
 */
export function minus(uint, b) {
	const diff = uint - b;
	if (diff < 0n) {
		return MAX + 1n + diff;
	}
	return diff;
}

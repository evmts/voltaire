import { MAX } from "./constants.js";

/**
 * Bitwise NOT (256-bit)
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to invert
 * @returns {import('./BrandedUint.js').BrandedUint} ~uint (masked to 256 bits)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(0n);
 * const result = Uint256.bitwiseNot(a); // MAX
 * ```
 */
export function bitwiseNot(uint) {
	return MAX ^ uint;
}

import { MAX } from "./constants.js";

/**
 * Left shift
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to shift
 * @param {import('./BrandedUint.js').BrandedUint} bits - Number of bits to shift
 * @returns {import('./BrandedUint.js').BrandedUint} uint << bits (mod 2^256)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(1n);
 * const b = Uint256.from(8n);
 * const result = Uint256.shiftLeft(a, b); // 256n
 * ```
 */
export function shiftLeft(uint, bits) {
	const shifted = uint << bits;
	return shifted & MAX;
}

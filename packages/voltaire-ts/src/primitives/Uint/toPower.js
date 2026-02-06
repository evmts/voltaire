import { MAX } from "./constants.js";

/**
 * Exponentiation
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Base value
 * @param {import('./BrandedUint.js').BrandedUint} exponent - Exponent value
 * @returns {import('./BrandedUint.js').BrandedUint} uint^exponent mod 2^256
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const base = Uint256.from(2n);
 * const exp = Uint256.from(8n);
 * const result = Uint256.toPower(base, exp); // 256n
 * ```
 */
export function toPower(uint, exponent) {
	let result = 1n;
	let b = uint;
	let e = exponent;

	while (e > 0n) {
		if (e & 1n) {
			result = (result * b) & MAX;
		}
		b = (b * b) & MAX;
		e = e >> 1n;
	}

	return result;
}

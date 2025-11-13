/**
 * Calculate greatest common divisor
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - First operand
 * @param {import('./BrandedUint128.js').BrandedUint128} b - Second operand
 * @returns {import('./BrandedUint128.js').BrandedUint128} GCD of uint and b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(48n);
 * const b = Uint128.from(18n);
 * const result = Uint128.gcd(a, b); // 6n
 * ```
 */
export function gcd(uint, b) {
	let a = uint;
	let x = b;

	while (x !== 0n) {
		const temp = x;
		x = a % x;
		a = temp;
	}

	return a;
}

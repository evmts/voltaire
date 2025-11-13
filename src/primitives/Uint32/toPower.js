/**
 * Raise Uint32 to power with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Base
 * @param {import('./BrandedUint32.js').BrandedUint32} exp - Exponent
 * @returns {import('./BrandedUint32.js').BrandedUint32} Result (uint ^ exp) mod 2^32
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const base = Uint32.from(2);
 * const exp = Uint32.from(10);
 * const result = Uint32.toPower(base, exp); // 1024
 * ```
 */
export function toPower(uint, exp) {
	if (exp === 0) return /** @type {import('./BrandedUint32.js').BrandedUint32} */ (1);
	if (exp === 1) return uint;

	let result = 1;
	let base = /** @type {number} */ (uint);
	let exponent = /** @type {number} */ (exp);

	while (exponent > 0) {
		if (exponent & 1) {
			result = Math.imul(result, base) >>> 0;
		}
		base = Math.imul(base, base) >>> 0;
		exponent = exponent >>> 1;
	}

	return /** @type {import('./BrandedUint32.js').BrandedUint32} */ (result);
}

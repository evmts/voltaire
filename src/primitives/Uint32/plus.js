import { MAX } from "./constants.js";

/**
 * Add Uint32 value with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - First operand
 * @param {import('./BrandedUint32.js').BrandedUint32} b - Second operand
 * @returns {import('./BrandedUint32.js').BrandedUint32} Sum (uint + b) mod 2^32
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from(50);
 * const sum = Uint32.plus(a, b); // 150
 * ```
 */
export function plus(uint, b) {
	return ((uint + b) >>> 0);
}

import { MAX } from "./constants.js";

/**
 * Add two Uint16 values with overflow checking
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} a - First operand
 * @param {import('./BrandedUint16.js').BrandedUint16} b - Second operand
 * @returns {import('./BrandedUint16.js').BrandedUint16} Sum (a + b)
 * @throws {Error} If result exceeds maximum value
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(30000);
 * const b = Uint16.from(20000);
 * const sum = Uint16.plus(a, b); // 50000
 * ```
 */
export function plus(a, b) {
	const sum = a + b;
	if (sum > MAX) {
		throw new Error(`Uint16 overflow: ${a} + ${b} = ${sum} exceeds maximum (65535)`);
	}
	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (sum);
}

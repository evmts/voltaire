import { MAX } from "./constants.js";

/**
 * Multiply two Uint16 values with overflow checking
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} a - First operand
 * @param {import('./BrandedUint16.js').BrandedUint16} b - Second operand
 * @returns {import('./BrandedUint16.js').BrandedUint16} Product (a * b)
 * @throws {Error} If result exceeds maximum value
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(100);
 * const b = Uint16.from(500);
 * const product = Uint16.times(a, b); // 50000
 * ```
 */
export function times(a, b) {
	const product = a * b;
	if (product > MAX) {
		throw new Error(`Uint16 overflow: ${a} * ${b} = ${product} exceeds maximum (65535)`);
	}
	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (product);
}

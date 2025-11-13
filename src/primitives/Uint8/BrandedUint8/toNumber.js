/**
 * Convert Uint8 to number
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} uint - Uint8 value
 * @returns {number} number value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const value = Uint8.from(255);
 * const num = Uint8.toNumber(value); // 255
 * ```
 */
export function toNumber(uint) {
	return uint;
}

/**
 * Convert Uint32 to number
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Uint32 value to convert
 * @returns {number} number value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const value = Uint32.from(255);
 * const num = Uint32.toNumber(value); // 255
 * ```
 */
export function toNumber(uint) {
	return uint;
}

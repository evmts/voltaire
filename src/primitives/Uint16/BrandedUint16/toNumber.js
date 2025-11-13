/**
 * Convert Uint16 to number
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} uint - Uint16 value
 * @returns {number} number value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const value = Uint16.from(65535);
 * const num = Uint16.toNumber(value); // 65535
 * ```
 */
export function toNumber(uint) {
	return uint;
}

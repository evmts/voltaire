/**
 * Return maximum of two Uint32 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - First value
 * @param {import('./BrandedUint32.js').BrandedUint32} b - Second value
 * @returns {import('./BrandedUint32.js').BrandedUint32} Maximum value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from(200);
 * const result = Uint32.maximum(a, b); // 200
 * ```
 */
export function maximum(uint, b) {
	return uint > b ? uint : b;
}

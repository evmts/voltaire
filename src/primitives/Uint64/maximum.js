/**
 * Return maximum of two Uint64 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - First value
 * @param {import('./BrandedUint64.js').BrandedUint64} b - Second value
 * @returns {import('./BrandedUint64.js').BrandedUint64} Maximum value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.from(200n);
 * const result = Uint64.maximum(a, b); // 200n
 * ```
 */
export function maximum(uint, b) {
	return uint > b ? uint : b;
}

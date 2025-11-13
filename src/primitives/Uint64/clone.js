/**
 * Clone Uint64 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - Value to clone
 * @returns {import('./BrandedUint64.js').BrandedUint64} Cloned value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.clone(a);
 * ```
 */
export function clone(uint) {
	return uint;
}

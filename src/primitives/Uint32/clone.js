/**
 * Clone Uint32 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Value to clone
 * @returns {import('./BrandedUint32.js').BrandedUint32} Cloned value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.clone(a);
 * ```
 */
export function clone(uint) {
	return uint;
}

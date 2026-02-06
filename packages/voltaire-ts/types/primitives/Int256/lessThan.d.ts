/**
 * Check if Int256 is less than another
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} a - First value
 * @param {import('./Int256Type.js').BrandedInt256} b - Second value
 * @returns {boolean} True if a < b
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-1n);
 * const b = Int256.from(0n);
 * Int256.lessThan(a, b); // true
 * ```
 */
export function lessThan(a: import("./Int256Type.js").BrandedInt256, b: import("./Int256Type.js").BrandedInt256): boolean;
//# sourceMappingURL=lessThan.d.ts.map
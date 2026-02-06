/**
 * Check if Uint64 value is zero
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - Value to check
 * @returns {boolean} true if zero
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(0n);
 * const result = Uint64.isZero(a); // true
 * ```
 */
export function isZero(uint: import("./Uint64Type.js").Uint64Type): boolean;
//# sourceMappingURL=isZero.d.ts.map
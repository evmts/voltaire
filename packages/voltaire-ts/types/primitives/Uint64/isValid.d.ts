/**
 * Check if value is a valid Uint64
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {value is import('./Uint64Type.js').Uint64Type} true if valid Uint64
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const result1 = Uint64.isValid(100n); // true
 * const result2 = Uint64.isValid(-1n); // false
 * const result3 = Uint64.isValid(100); // false (must be bigint)
 * ```
 */
export function isValid(value: unknown): value is import("./Uint64Type.js").Uint64Type;
//# sourceMappingURL=isValid.d.ts.map
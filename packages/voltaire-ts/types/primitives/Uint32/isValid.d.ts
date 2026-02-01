/**
 * Check if value is a valid Uint32
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {value is import('./Uint32Type.js').Uint32Type} true if valid Uint32
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const result1 = Uint32.isValid(100); // true
 * const result2 = Uint32.isValid(-1); // false
 * const result3 = Uint32.isValid(5000000000); // false (exceeds max)
 * ```
 */
export function isValid(value: unknown): value is import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=isValid.d.ts.map
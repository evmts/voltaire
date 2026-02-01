/**
 * Check if first Uint16 is less than second
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} a - First operand
 * @param {import('./Uint16Type.js').Uint16Type} b - Second operand
 * @returns {boolean} true if a < b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(10000);
 * const b = Uint16.from(30000);
 * const isLess = Uint16.lessThan(a, b); // true
 * ```
 */
export function lessThan(a: import("./Uint16Type.js").Uint16Type, b: import("./Uint16Type.js").Uint16Type): boolean;
//# sourceMappingURL=lessThan.d.ts.map
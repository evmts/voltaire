/**
 * Check if first Uint8 is less than second
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./Uint8Type.js').Uint8Type} a - First operand
 * @param {import('./Uint8Type.js').Uint8Type} b - Second operand
 * @returns {boolean} true if a < b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(50);
 * const b = Uint8.from(100);
 * const isLess = Uint8.lessThan(a, b); // true
 * ```
 */
export function lessThan(a: import("./Uint8Type.js").Uint8Type, b: import("./Uint8Type.js").Uint8Type): boolean;
//# sourceMappingURL=lessThan.d.ts.map
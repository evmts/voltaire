/**
 * Check if two Uint16 values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} a - First operand
 * @param {import('./Uint16Type.js').Uint16Type} b - Second operand
 * @returns {boolean} true if a === b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(30000);
 * const b = Uint16.from(30000);
 * const isEqual = Uint16.equals(a, b); // true
 * ```
 */
export function equals(a: import("./Uint16Type.js").Uint16Type, b: import("./Uint16Type.js").Uint16Type): boolean;
//# sourceMappingURL=equals.d.ts.map
/**
 * Bitwise AND of two Uint8 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./Uint8Type.js').Uint8Type} a - First operand
 * @param {import('./Uint8Type.js').Uint8Type} b - Second operand
 * @returns {import('./Uint8Type.js').Uint8Type} Bitwise AND result
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(0b11110000);
 * const b = Uint8.from(0b11001100);
 * const result = Uint8.bitwiseAnd(a, b); // 0b11000000 = 192
 * ```
 */
export function bitwiseAnd(a: import("./Uint8Type.js").Uint8Type, b: import("./Uint8Type.js").Uint8Type): import("./Uint8Type.js").Uint8Type;
//# sourceMappingURL=bitwiseAnd.d.ts.map
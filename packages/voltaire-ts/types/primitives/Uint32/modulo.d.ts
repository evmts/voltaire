/**
 * Modulo Uint32 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} uint - Dividend
 * @param {import('./Uint32Type.js').Uint32Type} b - Divisor
 * @returns {import('./Uint32Type.js').Uint32Type} Remainder (uint % b)
 * @throws {Uint32DivisionByZeroError} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from(3);
 * const remainder = Uint32.modulo(a, b); // 1
 * ```
 */
export function modulo(uint: import("./Uint32Type.js").Uint32Type, b: import("./Uint32Type.js").Uint32Type): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=modulo.d.ts.map
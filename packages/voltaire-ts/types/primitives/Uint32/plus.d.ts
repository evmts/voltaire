/**
 * Add two Uint32 values with overflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * `plusChecked` is an explicit alias and `plusWrapping` wraps mod 2^32.
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} uint - First operand
 * @param {import('./Uint32Type.js').Uint32Type} b - Second operand
 * @returns {import('./Uint32Type.js').Uint32Type} Sum (uint + b)
 * @throws {Uint32OverflowError} If the result exceeds 2^32 - 1
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from(50);
 * const sum = Uint32.plus(a, b); // 150
 * ```
 */
export function plus(uint: import("./Uint32Type.js").Uint32Type, b: import("./Uint32Type.js").Uint32Type): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=plus.d.ts.map
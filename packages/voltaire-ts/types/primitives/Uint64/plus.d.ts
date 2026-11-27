/**
 * Add two Uint64 values with overflow checking
 *
 * Overflow mode: checked (uniform across all Uint sizes).
 * `plusChecked` is an explicit alias and `plusWrapping` wraps mod 2^64.
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - First operand
 * @param {import('./Uint64Type.js').Uint64Type} b - Second operand
 * @returns {import('./Uint64Type.js').Uint64Type} Sum (uint + b)
 * @throws {Uint64OverflowError} If the result exceeds 2^64 - 1
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.from(50n);
 * const sum = Uint64.plus(a, b); // 150n
 * ```
 */
export function plus(uint: import("./Uint64Type.js").Uint64Type, b: import("./Uint64Type.js").Uint64Type): import("./Uint64Type.js").Uint64Type;
//# sourceMappingURL=plus.d.ts.map
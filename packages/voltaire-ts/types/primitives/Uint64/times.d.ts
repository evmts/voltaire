/**
 * Multiply Uint64 value with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - First operand
 * @param {import('./Uint64Type.js').Uint64Type} b - Second operand
 * @returns {import('./Uint64Type.js').Uint64Type} Product (uint * b) mod 2^64
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.from(50n);
 * const product = Uint64.times(a, b); // 5000n
 * ```
 */
export function times(uint: import("./Uint64Type.js").Uint64Type, b: import("./Uint64Type.js").Uint64Type): import("./Uint64Type.js").Uint64Type;
//# sourceMappingURL=times.d.ts.map
/**
 * Multiply two Uint64 values with wrapping
 *
 * Returns the exact result modulo 2^64 and never throws. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} a - First operand
 * @param {import('./Uint64Type.js').Uint64Type} b - Second operand
 * @returns {import('./Uint64Type.js').Uint64Type} Product (a * b) mod 2^64
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * Uint64.timesWrapping(Uint64.MAX, Uint64.from(2n)); // Uint64.MAX - 1n
 * ```
 */
export function timesWrapping(a: import("./Uint64Type.js").Uint64Type, b: import("./Uint64Type.js").Uint64Type): import("./Uint64Type.js").Uint64Type;
//# sourceMappingURL=timesWrapping.d.ts.map
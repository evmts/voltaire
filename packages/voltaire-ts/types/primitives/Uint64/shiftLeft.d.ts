/**
 * Left shift Uint64 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - Value to shift
 * @param {bigint | number} bits - Number of bits to shift (0-63)
 * @returns {import('./Uint64Type.js').Uint64Type} Result (uint << bits) mod 2^64
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(1n);
 * const result = Uint64.shiftLeft(a, 8n); // 256n
 * ```
 */
export function shiftLeft(uint: import("./Uint64Type.js").Uint64Type, bits: bigint | number): import("./Uint64Type.js").Uint64Type;
//# sourceMappingURL=shiftLeft.d.ts.map
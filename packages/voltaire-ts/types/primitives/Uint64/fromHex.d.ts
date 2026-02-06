/**
 * Create Uint64 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {string} hex - hex string (with or without 0x prefix)
 * @returns {import('./Uint64Type.js').Uint64Type} Uint64 value
 * @throws {Uint64InvalidHexError} If input is not a string
 * @throws {Uint64NegativeError} If value is negative
 * @throws {Uint64OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.fromHex("0xffffffffffffffff");
 * const b = Uint64.fromHex("ff");
 * ```
 */
export function fromHex(hex: string): import("./Uint64Type.js").Uint64Type;
//# sourceMappingURL=fromHex.d.ts.map
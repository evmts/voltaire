/**
 * Create Uint16 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {string} hex - hex string (with or without 0x prefix)
 * @returns {import('./Uint16Type.js').Uint16Type} Uint16 value
 * @throws {Uint16InvalidHexError} If hex string is invalid
 * @throws {Uint16NegativeError} If value is negative
 * @throws {Uint16OverflowError} If value exceeds maximum (65535)
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.fromHex("0xffff");
 * const b = Uint16.fromHex("ffff");
 * ```
 */
export function fromHex(hex: string): import("./Uint16Type.js").Uint16Type;
//# sourceMappingURL=fromHex.d.ts.map
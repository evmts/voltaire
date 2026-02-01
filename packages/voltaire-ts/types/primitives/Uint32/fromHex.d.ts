/**
 * Create Uint32 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {string} hex - hex string (with or without 0x prefix)
 * @returns {import('./Uint32Type.js').Uint32Type} Uint32 value
 * @throws {Uint32InvalidHexError} If not a string or invalid hex
 * @throws {Uint32NegativeError} If value is negative
 * @throws {Uint32OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.fromHex("0xff");
 * const b = Uint32.fromHex("ff");
 * ```
 */
export function fromHex(hex: string): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=fromHex.d.ts.map
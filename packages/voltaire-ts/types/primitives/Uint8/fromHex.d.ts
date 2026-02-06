/**
 * Create Uint8 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {string} hex - hex string (with or without 0x prefix)
 * @returns {import('./Uint8Type.js').Uint8Type} Uint8 value
 * @throws {Uint8InvalidHexError} If hex string is invalid
 * @throws {Uint8NegativeError} If value is negative
 * @throws {Uint8OverflowError} If value exceeds maximum (255)
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.fromHex("0xff");
 * const b = Uint8.fromHex("ff");
 * ```
 */
export function fromHex(hex: string): import("./Uint8Type.js").Uint8Type;
//# sourceMappingURL=fromHex.d.ts.map
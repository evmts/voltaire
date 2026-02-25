/**
 * Convert Bytes16 to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {import('./Bytes16Type.js').Bytes16Type} bytes - Bytes16 to convert
 * @returns {import('../../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const hex = Bytes16.toHex(bytes);
 * // "0x1234567890abcdef1234567890abcdef"
 * ```
 */
export function toHex(bytes: import("./Bytes16Type.js").Bytes16Type): import("../../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map
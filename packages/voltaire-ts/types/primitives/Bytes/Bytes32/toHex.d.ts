/**
 * Convert Bytes32 to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./Bytes32Type.js').Bytes32Type} bytes - Bytes32 to convert
 * @returns {import('../../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const hex = Bytes32.toHex(bytes);
 * ```
 */
export function toHex(bytes: import("./Bytes32Type.js").Bytes32Type): import("../../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map
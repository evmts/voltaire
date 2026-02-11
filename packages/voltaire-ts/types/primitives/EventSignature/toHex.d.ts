/**
 * Convert EventSignature to hex string
 *
 * @param {import('./EventSignatureType.js').EventSignatureType} signature - 32-byte event signature
 * @returns {import('../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventSignature from './primitives/EventSignature/index.js';
 * const hex = EventSignature.toHex(signature);
 * // '0xddf252ad...'
 * ```
 */
export function toHex(signature: import("./EventSignatureType.js").EventSignatureType): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map
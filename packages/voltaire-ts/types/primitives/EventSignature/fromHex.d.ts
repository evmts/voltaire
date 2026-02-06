/**
 * Create EventSignature from hex string
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./EventSignatureType.js').EventSignatureType} 32-byte event signature
 * @throws {Error} If hex is not 32 bytes
 * @example
 * ```javascript
 * import * as EventSignature from './primitives/EventSignature/index.js';
 * const sig = EventSignature.fromHex('0xddf252ad...');
 * ```
 */
export function fromHex(hex: string): import("./EventSignatureType.js").EventSignatureType;
//# sourceMappingURL=fromHex.d.ts.map
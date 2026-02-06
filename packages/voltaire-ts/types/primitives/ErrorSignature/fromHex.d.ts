/**
 * Create ErrorSignature from hex string
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./ErrorSignatureType.js').ErrorSignatureType} 4-byte error signature
 * @throws {Error} If hex is not 4 bytes
 * @example
 * ```javascript
 * import * as ErrorSignature from './primitives/ErrorSignature/index.js';
 * const sig = ErrorSignature.fromHex('0xcf479181');
 * ```
 */
export function fromHex(hex: string): import("./ErrorSignatureType.js").ErrorSignatureType;
//# sourceMappingURL=fromHex.d.ts.map
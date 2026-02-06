/**
 * Convert ErrorSignature to hex string
 *
 * @param {import('./ErrorSignatureType.js').ErrorSignatureType} signature - 4-byte error signature
 * @returns {string} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as ErrorSignature from './primitives/ErrorSignature/index.js';
 * const hex = ErrorSignature.toHex(signature);
 * // '0xcf479181'
 * ```
 */
export function toHex(signature: import("./ErrorSignatureType.js").ErrorSignatureType): string;
//# sourceMappingURL=toHex.d.ts.map
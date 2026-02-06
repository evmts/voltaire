/**
 * Check if a public key is in compressed format
 *
 * Returns true for 33 bytes with 0x02/0x03 prefix, false otherwise
 *
 * @param {Uint8Array} bytes - Public key bytes
 * @returns {boolean} True if compressed format
 *
 * @example
 * ```javascript
 * import * as PublicKey from './primitives/PublicKey/index.js';
 * const isCompressed = PublicKey._isCompressed(bytes);
 * ```
 */
export function isCompressed(bytes: Uint8Array): boolean;
//# sourceMappingURL=isCompressed.d.ts.map
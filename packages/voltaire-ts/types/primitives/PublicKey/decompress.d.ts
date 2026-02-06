/**
 * Decompress a public key from 33 bytes (compressed) to 64 bytes (uncompressed)
 *
 * Solves y² = x³ + 7 mod p and chooses y based on prefix parity
 *
 * @param {Uint8Array} compressed - Compressed public key (33 bytes with 0x02/0x03 prefix)
 * @returns {import('./PublicKeyType.js').PublicKeyType} Uncompressed public key (64 bytes)
 * @throws {Error} If compressed format is invalid
 *
 * @example
 * ```javascript
 * import * as PublicKey from './primitives/PublicKey/index.js';
 * const uncompressed = PublicKey._decompress(compressed);
 * ```
 */
export function decompress(compressed: Uint8Array): import("./PublicKeyType.js").PublicKeyType;
//# sourceMappingURL=decompress.d.ts.map
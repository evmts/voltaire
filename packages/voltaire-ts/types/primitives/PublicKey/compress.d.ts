/**
 * Compress a public key from 64 bytes (uncompressed) to 33 bytes (compressed)
 *
 * Compressed format: prefix (1 byte) + x-coordinate (32 bytes)
 * Prefix is 0x02 if y is even, 0x03 if y is odd
 *
 * @param {import('./PublicKeyType.js').PublicKeyType} publicKey - Uncompressed public key (64 bytes)
 * @returns {Uint8Array} Compressed public key (33 bytes)
 * @throws {InvalidLengthError} If public key is not 64 bytes
 *
 * @example
 * ```javascript
 * import * as PublicKey from './primitives/PublicKey/index.js';
 * const compressed = PublicKey._compress(publicKey);
 * ```
 */
export function compress(publicKey: import("./PublicKeyType.js").PublicKeyType): Uint8Array;
//# sourceMappingURL=compress.d.ts.map
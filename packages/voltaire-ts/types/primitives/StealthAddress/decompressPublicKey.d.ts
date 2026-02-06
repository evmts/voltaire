/**
 * Decompress compressed secp256k1 public key
 *
 * Converts 33-byte compressed format to 64-byte uncompressed format.
 * Decompresses by reconstructing y-coordinate from x and prefix.
 *
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {Uint8Array} compressed - 33-byte compressed public key
 * @returns {Uint8Array} 64-byte uncompressed public key
 * @throws {InvalidPublicKeyError} If input length is invalid or decompression fails
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 * const compressed = new Uint8Array(33);
 * compressed[0] = 0x02; // even y
 * const uncompressed = StealthAddress.decompressPublicKey(compressed);
 * console.log(uncompressed.length); // 64
 * ```
 */
export function decompressPublicKey(compressed: Uint8Array): Uint8Array;
//# sourceMappingURL=decompressPublicKey.d.ts.map
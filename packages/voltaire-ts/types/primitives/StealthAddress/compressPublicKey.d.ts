/**
 * Compress uncompressed secp256k1 public key
 *
 * Converts 64-byte uncompressed format (x, y) to 33-byte compressed format.
 * Uses 0x02 prefix if y is even, 0x03 if y is odd.
 *
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {Uint8Array} uncompressed - 64-byte uncompressed public key
 * @returns {Uint8Array} 33-byte compressed public key
 * @throws {InvalidPublicKeyError} If input length is invalid
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 * const uncompressed = new Uint8Array(64); // x || y
 * const compressed = StealthAddress.compressPublicKey(uncompressed);
 * console.log(compressed.length); // 33
 * ```
 */
export function compressPublicKey(uncompressed: Uint8Array): Uint8Array;
//# sourceMappingURL=compressPublicKey.d.ts.map
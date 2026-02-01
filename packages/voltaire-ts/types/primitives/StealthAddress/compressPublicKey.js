// @ts-nocheck
import { COMPRESSED_PUBLIC_KEY_SIZE, UNCOMPRESSED_PUBLIC_KEY_SIZE, } from "./constants.js";
import { InvalidPublicKeyError } from "./errors.js";
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
export function compressPublicKey(uncompressed) {
    if (uncompressed.length !== UNCOMPRESSED_PUBLIC_KEY_SIZE) {
        throw new InvalidPublicKeyError(`Uncompressed public key must be ${UNCOMPRESSED_PUBLIC_KEY_SIZE} bytes, got ${uncompressed.length}`, {
            code: "INVALID_PUBLIC_KEY_LENGTH",
            context: { actualLength: uncompressed.length },
        });
    }
    const compressed = new Uint8Array(COMPRESSED_PUBLIC_KEY_SIZE);
    // Copy x-coordinate
    compressed.set(uncompressed.slice(0, 32), 1);
    // Determine prefix based on y parity
    const y = uncompressed.slice(32, 64);
    const isEven = (y[y.length - 1] & 1) === 0;
    compressed[0] = isEven ? 0x02 : 0x03;
    return compressed;
}

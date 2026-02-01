// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { PUBLIC_KEY_SIZE } from "./constants.js";
import { InvalidPublicKeyError, Secp256k1Error } from "./errors.js";
/**
 * Add two secp256k1 public key points
 *
 * Performs elliptic curve point addition: P1 + P2.
 * Used in ERC-5564 stealth address generation.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @see https://eips.ethereum.org/EIPS/eip-5564 for ERC-5564 stealth addresses
 * @since 0.0.0
 * @param {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} pubKey1 - First 64-byte uncompressed public key
 * @param {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} pubKey2 - Second 64-byte uncompressed public key
 * @returns {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} Result 64-byte uncompressed public key
 * @throws {InvalidPublicKeyError} If either public key is invalid
 * @throws {Secp256k1Error} If point addition fails
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const pubKey1 = Secp256k1.derivePublicKey(privateKey1);
 * const pubKey2 = Secp256k1.derivePublicKey(privateKey2);
 * const sum = Secp256k1.addPoints(pubKey1, pubKey2);
 * console.log(sum.length); // 64
 * ```
 */
export function addPoints(pubKey1, pubKey2) {
    if (pubKey1.length !== PUBLIC_KEY_SIZE) {
        throw new InvalidPublicKeyError(`Public key 1 must be ${PUBLIC_KEY_SIZE} bytes, got ${pubKey1.length}`, {
            code: "INVALID_PUBLIC_KEY_LENGTH",
            context: { actualLength: pubKey1.length, keyNumber: 1 },
            docsPath: "/crypto/secp256k1/add-points#error-handling",
        });
    }
    if (pubKey2.length !== PUBLIC_KEY_SIZE) {
        throw new InvalidPublicKeyError(`Public key 2 must be ${PUBLIC_KEY_SIZE} bytes, got ${pubKey2.length}`, {
            code: "INVALID_PUBLIC_KEY_LENGTH",
            context: { actualLength: pubKey2.length, keyNumber: 2 },
            docsPath: "/crypto/secp256k1/add-points#error-handling",
        });
    }
    try {
        // Add 0x04 prefix for uncompressed format
        const full1 = new Uint8Array(65);
        full1[0] = 0x04;
        full1.set(pubKey1, 1);
        const full2 = new Uint8Array(65);
        full2[0] = 0x04;
        full2.set(pubKey2, 1);
        // Convert to hex strings for Point.fromHex
        const hex1 = Array.from(full1)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        const hex2 = Array.from(full2)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        // Parse points
        const point1 = secp256k1.Point.fromHex(hex1);
        const point2 = secp256k1.Point.fromHex(hex2);
        // Add points
        const sum = point1.add(point2);
        // Convert back to uncompressed bytes
        const resultBytes = sum.toBytes(false);
        if (resultBytes[0] !== 0x04) {
            throw new Secp256k1Error("Invalid point format after addition", {
                code: "INVALID_POINT_FORMAT",
                context: { prefix: resultBytes[0] },
                docsPath: "/crypto/secp256k1/add-points#error-handling",
            });
        }
        // Return 64 bytes without 0x04 prefix
        return /** @type {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} */ (resultBytes.slice(1));
    }
    catch (error) {
        throw new Secp256k1Error(`Point addition failed: ${error}`, {
            code: "POINT_ADDITION_FAILED",
            context: {
                pubKey1Length: pubKey1.length,
                pubKey2Length: pubKey2.length,
            },
            docsPath: "/crypto/secp256k1/add-points#error-handling",
            cause: error,
        });
    }
}

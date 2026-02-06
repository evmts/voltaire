import { InvalidPublicKeyError } from "../errors.js";
import { fromBytes } from "./fromBytes.js";
/**
 * Create a Secp256k1PublicKeyType from various input formats
 *
 * Accepts either a Uint8Array (raw bytes) or hex string.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array | string} input - Public key as raw bytes or hex string (with or without 0x prefix)
 * @returns {import('../Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} Branded public key
 * @throws {InvalidPublicKeyError} If input format or public key is invalid
 * @example
 * ```javascript
 * import * as PublicKey from './crypto/Secp256k1/PublicKey/index.js';
 * // From bytes
 * const pk1 = PublicKey.from(keyBytes);
 * // From hex string
 * const pk2 = PublicKey.from("0x1234...");
 * ```
 */
export function from(input) {
    if (typeof input === "string") {
        // Convert hex string to bytes
        const hexStr = input.startsWith("0x") ? input.slice(2) : input;
        if (!/^[0-9a-fA-F]+$/.test(hexStr)) {
            throw new InvalidPublicKeyError(`Invalid hex string: ${input}`, {
                code: -32602,
                context: { input },
                docsPath: "/crypto/secp256k1/public-key#error-handling",
            });
        }
        if (hexStr.length !== 128) {
            throw new InvalidPublicKeyError(`Invalid public key hex length: expected 128 characters (64 bytes), got ${hexStr.length}`, {
                code: -32602,
                context: { length: hexStr.length, expected: 128 },
                docsPath: "/crypto/secp256k1/public-key#error-handling",
            });
        }
        const bytes = new Uint8Array(64);
        for (let i = 0; i < 64; i++) {
            bytes[i] = Number.parseInt(hexStr.slice(i * 2, i * 2 + 2), 16);
        }
        return fromBytes(bytes);
    }
    // Assume it's a Uint8Array
    return fromBytes(input);
}

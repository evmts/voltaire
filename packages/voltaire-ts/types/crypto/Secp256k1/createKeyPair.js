import { derivePublicKey } from "./derivePublicKey.js";
import { randomPrivateKey } from "./randomPrivateKey.js";
/**
 * Generate a new secp256k1 key pair
 *
 * @returns {{ privateKey: Uint8Array, publicKey: Uint8Array }} Key pair with 32-byte private key and 65-byte uncompressed public key
 *
 * @example
 * ```javascript
 * import { Secp256k1 } from './crypto/Secp256k1/index.js';
 * const { privateKey, publicKey } = Secp256k1.createKeyPair();
 * ```
 */
export function createKeyPair() {
    const privateKey = randomPrivateKey();
    const publicKey = derivePublicKey(
    /** @type {import('../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} */ (privateKey));
    return { privateKey, publicKey };
}

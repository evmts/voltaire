/**
 * Generate a cryptographically secure random secp256k1 private key
 *
 * @returns {Uint8Array} 32-byte private key
 * @throws {Secp256k1Error} If crypto.getRandomValues is not available or generation fails
 *
 * @example
 * ```javascript
 * import { Secp256k1 } from './crypto/Secp256k1/index.js';
 * const privateKey = Secp256k1.randomPrivateKey();
 * const publicKey = Secp256k1.derivePublicKey(privateKey);
 * ```
 */
export function randomPrivateKey(): Uint8Array;
//# sourceMappingURL=randomPrivateKey.d.ts.map
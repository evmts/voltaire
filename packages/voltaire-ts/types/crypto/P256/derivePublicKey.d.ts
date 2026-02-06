/**
 * Derive public key from private key
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./P256PrivateKeyType.js').P256PrivateKeyType} privateKey - 32-byte private key
 * @returns {import('./P256PublicKeyType.js').P256PublicKeyType} 64-byte uncompressed public key (x || y coordinates)
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @example
 * ```javascript
 * import * as P256 from './crypto/P256/index.js';
 * const privateKey = new Uint8Array(32);
 * const publicKey = P256.derivePublicKey(privateKey);
 * ```
 */
export function derivePublicKey(privateKey: import("./P256PrivateKeyType.js").P256PrivateKeyType): import("./P256PublicKeyType.js").P256PublicKeyType;
//# sourceMappingURL=derivePublicKey.d.ts.map
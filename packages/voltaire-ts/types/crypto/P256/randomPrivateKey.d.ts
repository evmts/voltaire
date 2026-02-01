/**
 * Generate a cryptographically secure random P256 private key
 *
 * @returns {Uint8Array} 32-byte private key
 * @throws {P256Error} If crypto.getRandomValues is not available or generation fails
 *
 * @example
 * ```javascript
 * import { P256 } from './crypto/P256/index.js';
 * const privateKey = P256.randomPrivateKey();
 * const publicKey = P256.derivePublicKey(privateKey);
 * ```
 */
export function randomPrivateKey(): Uint8Array;
//# sourceMappingURL=randomPrivateKey.d.ts.map
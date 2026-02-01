/**
 * Validate private key
 *
 * Checks that the private key is within valid range [1, n-1] where n
 * is the curve order.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} privateKey - 32-byte private key
 * @returns {boolean} true if private key is valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const privateKey = new Uint8Array(32);
 * const valid = Secp256k1.isValidPrivateKey(privateKey);
 * ```
 */
export function isValidPrivateKey(privateKey: Uint8Array): boolean;
//# sourceMappingURL=isValidPrivateKey.d.ts.map
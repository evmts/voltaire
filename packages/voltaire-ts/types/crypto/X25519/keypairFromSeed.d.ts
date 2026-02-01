/**
 * Generate X25519 keypair from seed
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} seed - 32-byte seed for deterministic generation
 * @returns {{secretKey: import('./SecretKey.js').SecretKey, publicKey: import('./PublicKey.js').PublicKey}} Object with secretKey and publicKey
 * @throws {InvalidSecretKeyError} If seed length is invalid
 * @throws {X25519Error} If keypair generation fails
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * const seed = crypto.getRandomValues(new Uint8Array(32));
 * const keypair = X25519.keypairFromSeed(seed);
 * console.log(keypair.secretKey.length); // 32
 * console.log(keypair.publicKey.length); // 32
 * ```
 */
export function keypairFromSeed(seed: Uint8Array): {
    secretKey: import("./SecretKey.js").SecretKey;
    publicKey: import("./PublicKey.js").PublicKey;
};
//# sourceMappingURL=keypairFromSeed.d.ts.map
/**
 * @typedef {Object} SignOptions
 * @property {Uint8Array | boolean} [extraEntropy] - Extra entropy for non-deterministic signing.
 *   Pass `true` to use random bytes, or a Uint8Array (32 bytes) for custom entropy.
 *   When not provided, uses deterministic RFC 6979 signing.
 */
/**
 * Sign a message hash with a private key
 *
 * Uses deterministic ECDSA (RFC 6979) for signature generation by default.
 * Returns signature with Ethereum-compatible v value (27 or 28).
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../../primitives/Hash/index.js').HashType} messageHash - 32-byte message hash to sign
 * @param {import('../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} privateKey - 32-byte private key
 * @param {SignOptions} [options] - Signing options
 * @returns {import('./SignatureType.js').Secp256k1SignatureType} ECDSA signature with r, s, v components
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @throws {CryptoError} If signing fails
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * import * as PrivateKey from './primitives/PrivateKey/index.js';
 * const messageHash = Hash.keccak256String('Hello!');
 * const privateKey = PrivateKey.from(new Uint8Array(32));
 * // Deterministic (RFC 6979)
 * const signature = Secp256k1.sign(messageHash, privateKey);
 * // With extra entropy for added randomness
 * const sig2 = Secp256k1.sign(messageHash, privateKey, { extraEntropy: true });
 * ```
 */
export function sign(messageHash: import("../../primitives/Hash/index.js").HashType, privateKey: import("../../primitives/PrivateKey/PrivateKeyType.js").PrivateKeyType, options?: SignOptions): import("./SignatureType.js").Secp256k1SignatureType;
export type SignOptions = {
    /**
     * - Extra entropy for non-deterministic signing.
     * Pass `true` to use random bytes, or a Uint8Array (32 bytes) for custom entropy.
     * When not provided, uses deterministic RFC 6979 signing.
     */
    extraEntropy?: boolean | Uint8Array<ArrayBufferLike> | undefined;
};
//# sourceMappingURL=sign.d.ts.map
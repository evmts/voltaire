/**
 * Sign a pre-hashed message with a private key
 *
 * This is the hash-level API that operates directly on a 32-byte hash.
 * Use this when you need custom hashing schemes or interop with other libraries.
 * For standard Ethereum signing, use sign() instead.
 *
 * Uses deterministic ECDSA (RFC 6979) for signature generation.
 * Returns signature with Ethereum-compatible v value (27 or 28).
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../../primitives/Hash/index.js').HashType} hash - 32-byte hash to sign (pre-hashed message)
 * @param {import('../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} privateKey - 32-byte private key
 * @returns {import('./SignatureType.js').Secp256k1SignatureType} ECDSA signature with r, s, v components
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @throws {CryptoError} If signing fails or hash is not 32 bytes
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * import * as PrivateKey from './primitives/PrivateKey/index.js';
 *
 * // Sign a pre-hashed message (hash-level API)
 * const hash = Hash.keccak256String('Hello!');
 * const privateKey = PrivateKey.from(new Uint8Array(32));
 * const signature = Secp256k1.signHash(hash, privateKey);
 *
 * // For comparison, sign() hashes internally (message-level API)
 * const signature2 = Secp256k1.sign(Hash.keccak256String('Hello!'), privateKey);
 * ```
 */
export function signHash(hash: import("../../primitives/Hash/index.js").HashType, privateKey: import("../../primitives/PrivateKey/PrivateKeyType.js").PrivateKeyType): import("./SignatureType.js").Secp256k1SignatureType;
//# sourceMappingURL=signHash.d.ts.map
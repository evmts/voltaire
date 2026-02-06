/**
 * Verify an ECDSA signature against a pre-hashed message
 *
 * This is the hash-level API that operates directly on a 32-byte hash.
 * Use this when you need custom hashing schemes or interop with other libraries.
 * For standard Ethereum signing, use verify() instead.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SignatureType.js').Secp256k1SignatureType} signature - ECDSA signature with r, s, v components (r and s are HashType)
 * @param {import('../../primitives/Hash/index.js').HashType} hash - 32-byte hash that was signed (pre-hashed message)
 * @param {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} publicKey - 64-byte uncompressed public key
 * @returns {boolean} true if signature is valid, false otherwise
 * @throws {CryptoError} If hash is not 32 bytes
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 *
 * // Verify a signature against a pre-hashed message (hash-level API)
 * const hash = Hash.keccak256String('Hello!');
 * const valid = Secp256k1.verifyHash({ r, s, v: 27 }, hash, publicKey);
 *
 * // For comparison, verify() hashes internally (message-level API)
 * const valid2 = Secp256k1.verify({ r, s, v: 27 }, messageHash, publicKey);
 * ```
 */
export function verifyHash(signature: import("./SignatureType.js").Secp256k1SignatureType, hash: import("../../primitives/Hash/index.js").HashType, publicKey: import("./Secp256k1PublicKeyType.js").Secp256k1PublicKeyType): boolean;
//# sourceMappingURL=verifyHash.d.ts.map
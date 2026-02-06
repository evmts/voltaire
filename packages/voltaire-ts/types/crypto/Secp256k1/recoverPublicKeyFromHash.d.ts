/**
 * Recover public key from signature and pre-hashed message
 *
 * This is the hash-level API that operates directly on a 32-byte hash.
 * Use this when you need custom hashing schemes or interop with other libraries.
 * For standard Ethereum signing, use recoverPublicKey() instead.
 *
 * Uses the recovery id (v) to recover the exact public key that created
 * the signature. This is what enables Ethereum's address recovery from
 * transaction signatures.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} signature - ECDSA signature components
 * @param {Uint8Array} signature.r - 32-byte signature component r
 * @param {Uint8Array} signature.s - 32-byte signature component s
 * @param {number} signature.v - Recovery id (27/28 or 0/1)
 * @param {import('../../primitives/Hash/index.js').HashType} hash - 32-byte hash that was signed (pre-hashed message)
 * @returns {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} 64-byte uncompressed public key
 * @throws {InvalidSignatureError} If signature or recovery fails
 * @throws {CryptoError} If hash is not 32 bytes
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 *
 * // Recover public key from a pre-hashed message (hash-level API)
 * const hash = Hash.keccak256String('Hello');
 * const recovered = Secp256k1.recoverPublicKeyFromHash(
 *   { r: rBytes, s: sBytes, v: 27 },
 *   hash
 * );
 *
 * // For comparison, recoverPublicKey() hashes internally (message-level API)
 * const recovered2 = Secp256k1.recoverPublicKey(
 *   { r: rBytes, s: sBytes, v: 27 },
 *   messageHash
 * );
 * ```
 */
export function recoverPublicKeyFromHash(signature: {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
}, hash: import("../../primitives/Hash/index.js").HashType): import("./Secp256k1PublicKeyType.js").Secp256k1PublicKeyType;
//# sourceMappingURL=recoverPublicKeyFromHash.d.ts.map
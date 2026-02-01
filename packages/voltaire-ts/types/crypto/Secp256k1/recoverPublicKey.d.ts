/**
 * Recover public key from signature and message hash
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
 * @param {import('../../primitives/Hash/index.js').HashType} messageHash - 32-byte message hash that was signed
 * @returns {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} 64-byte uncompressed public key
 * @throws {InvalidSignatureError} If signature or recovery fails
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * const messageHash = Hash.keccak256String('Hello');
 * const recovered = Secp256k1.recoverPublicKey(
 *   { r: rBytes, s: sBytes, v: 27 },
 *   messageHash
 * );
 * ```
 */
export function recoverPublicKey(signature: {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
}, messageHash: import("../../primitives/Hash/index.js").HashType): import("./Secp256k1PublicKeyType.js").Secp256k1PublicKeyType;
//# sourceMappingURL=recoverPublicKey.d.ts.map
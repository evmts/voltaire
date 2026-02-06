/**
 * Verify an ECDSA signature
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SignatureType.js').Secp256k1SignatureType} signature - ECDSA signature with r, s, v components (r and s are HashType)
 * @param {import('../../primitives/Hash/index.js').HashType} messageHash - 32-byte message hash that was signed
 * @param {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} publicKey - 64-byte uncompressed public key
 * @returns {boolean} true if signature is valid, false otherwise
 * @throws {InvalidSignatureError} If signature v is invalid
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * const r = Hash.from(rBytes);
 * const s = Hash.from(sBytes);
 * const valid = Secp256k1.verify({ r, s, v: 27 }, messageHash, publicKey);
 * ```
 */
export function verify(signature: import("./SignatureType.js").Secp256k1SignatureType, messageHash: import("../../primitives/Hash/index.js").HashType, publicKey: import("./Secp256k1PublicKeyType.js").Secp256k1PublicKeyType): boolean;
//# sourceMappingURL=verify.d.ts.map
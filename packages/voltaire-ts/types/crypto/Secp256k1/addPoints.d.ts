/**
 * Add two secp256k1 public key points
 *
 * Performs elliptic curve point addition: P1 + P2.
 * Used in ERC-5564 stealth address generation.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @see https://eips.ethereum.org/EIPS/eip-5564 for ERC-5564 stealth addresses
 * @since 0.0.0
 * @param {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} pubKey1 - First 64-byte uncompressed public key
 * @param {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} pubKey2 - Second 64-byte uncompressed public key
 * @returns {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} Result 64-byte uncompressed public key
 * @throws {InvalidPublicKeyError} If either public key is invalid
 * @throws {Secp256k1Error} If point addition fails
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const pubKey1 = Secp256k1.derivePublicKey(privateKey1);
 * const pubKey2 = Secp256k1.derivePublicKey(privateKey2);
 * const sum = Secp256k1.addPoints(pubKey1, pubKey2);
 * console.log(sum.length); // 64
 * ```
 */
export function addPoints(pubKey1: import("./Secp256k1PublicKeyType.js").Secp256k1PublicKeyType, pubKey2: import("./Secp256k1PublicKeyType.js").Secp256k1PublicKeyType): import("./Secp256k1PublicKeyType.js").Secp256k1PublicKeyType;
//# sourceMappingURL=addPoints.d.ts.map
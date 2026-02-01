/**
 * Multiply generator point by scalar
 *
 * Performs scalar multiplication: scalar * G (generator point).
 * Used in ERC-5564 stealth address generation.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @see https://eips.ethereum.org/EIPS/eip-5564 for ERC-5564 stealth addresses
 * @since 0.0.0
 * @param {Uint8Array} scalar - 32-byte scalar value
 * @returns {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} Result 64-byte uncompressed public key
 * @throws {Secp256k1Error} If scalar multiplication fails
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const scalar = new Uint8Array(32);
 * scalar[31] = 5; // scalar = 5
 * const result = Secp256k1.scalarMultiply(scalar);
 * console.log(result.length); // 64
 * ```
 */
export function scalarMultiply(scalar: Uint8Array): import("./Secp256k1PublicKeyType.js").Secp256k1PublicKeyType;
//# sourceMappingURL=scalarMultiply.d.ts.map
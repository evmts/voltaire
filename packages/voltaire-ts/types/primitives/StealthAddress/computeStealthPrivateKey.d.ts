/**
 * Compute stealth private key from spending private key and shared secret hash
 *
 * Implements ERC-5564 private key derivation:
 * stealthPrivateKey = (spendingPrivateKey + hashedSharedSecret) mod n
 *
 * Where n is the secp256k1 curve order.
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564#stealth-private-key
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {Uint8Array} spendingPrivateKey - 32-byte spending private key
 * @param {Uint8Array} hashedSharedSecret - 32-byte hashed shared secret
 * @returns {Uint8Array} 32-byte stealth private key
 * @throws {StealthAddressError} If computation fails
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 *
 * // After finding matching stealth address
 * const stealthPrivKey = StealthAddress.computeStealthPrivateKey(
 *   spendingPrivateKey,
 *   hashedSharedSecret
 * );
 * // Use stealthPrivKey to spend from stealth address
 * ```
 */
export function computeStealthPrivateKey(spendingPrivateKey: Uint8Array, hashedSharedSecret: Uint8Array): Uint8Array;
//# sourceMappingURL=computeStealthPrivateKey.d.ts.map
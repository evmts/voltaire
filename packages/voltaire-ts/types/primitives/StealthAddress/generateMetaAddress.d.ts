/**
 * Generate stealth meta-address from spending and viewing public keys
 *
 * Concatenates 33-byte compressed spending and viewing public keys
 * into 66-byte stealth meta-address for ERC-5564.
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564#stealth-meta-address-format
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {import('./StealthAddressType.js').SpendingPublicKey} spendingPubKey - 33-byte compressed spending public key
 * @param {import('./StealthAddressType.js').ViewingPublicKey} viewingPubKey - 33-byte compressed viewing public key
 * @returns {import('./StealthAddressType.js').StealthMetaAddress} 66-byte stealth meta-address
 * @throws {InvalidPublicKeyError} If either public key has invalid length
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 *
 * const spendingPubKey = StealthAddress.compressPublicKey(
 *   Secp256k1.derivePublicKey(spendingPrivateKey)
 * );
 * const viewingPubKey = StealthAddress.compressPublicKey(
 *   Secp256k1.derivePublicKey(viewingPrivateKey)
 * );
 * const metaAddress = StealthAddress.generateMetaAddress(spendingPubKey, viewingPubKey);
 * console.log(metaAddress.length); // 66
 * ```
 */
export function generateMetaAddress(spendingPubKey: import("./StealthAddressType.js").SpendingPublicKey, viewingPubKey: import("./StealthAddressType.js").ViewingPublicKey): import("./StealthAddressType.js").StealthMetaAddress;
//# sourceMappingURL=generateMetaAddress.d.ts.map
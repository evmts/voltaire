/**
 * Check if stealth address belongs to recipient
 *
 * Implements ERC-5564 stealth address checking:
 * 1. Compute shared secret: ECDH(viewingPrivKey, ephemeralPubKey)
 * 2. Hash shared secret
 * 3. Check view tag matches (fast rejection)
 * 4. If matches, compute stealth private key
 * 5. Derive address and verify match
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564#stealth-address-checking
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {Uint8Array} viewingPrivateKey - 32-byte viewing private key
 * @param {import('./StealthAddressType.js').EphemeralPublicKey} ephemeralPublicKey - 33-byte compressed ephemeral public key
 * @param {import('./StealthAddressType.js').ViewTag} viewTag - View tag from announcement
 * @param {import('./StealthAddressType.js').SpendingPublicKey} spendingPublicKey - 33-byte compressed spending public key
 * @param {import('../Address/AddressType.js').AddressType} stealthAddress - Announced stealth address
 * @returns {import('./StealthAddressType.js').CheckStealthAddressResult} Match result with optional stealth private key
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 *
 * // Recipient scans announcements
 * const result = StealthAddress.checkStealthAddress(
 *   viewingPrivateKey,
 *   announcement.ephemeralPublicKey,
 *   announcement.viewTag,
 *   spendingPublicKey,
 *   announcement.stealthAddress
 * );
 *
 * if (result.isForRecipient) {
 *   console.log('Found stealth payment!');
 *   // Use result.stealthPrivateKey to spend
 * }
 * ```
 */
export function checkStealthAddress(viewingPrivateKey: Uint8Array, ephemeralPublicKey: import("./StealthAddressType.js").EphemeralPublicKey, viewTag: import("./StealthAddressType.js").ViewTag, spendingPublicKey: import("./StealthAddressType.js").SpendingPublicKey, stealthAddress: import("../Address/AddressType.js").AddressType): import("./StealthAddressType.js").CheckStealthAddressResult;
//# sourceMappingURL=checkStealthAddress.d.ts.map
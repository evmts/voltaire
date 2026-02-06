/**
 * Generate stealth address from meta-address
 *
 * Implements ERC-5564 stealth address generation:
 * 1. Parse meta-address → spending + viewing public keys
 * 2. Compute shared secret: ECDH(ephemeralPrivKey, viewingPubKey)
 * 3. Hash shared secret: keccak256(sharedSecret)
 * 4. Derive view tag: first byte of hash
 * 5. Compute stealth pubkey: spendingPubKey + hash * G
 * 6. Derive stealth address from pubkey
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564#stealth-address-generation
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {import('./StealthAddressType.js').StealthMetaAddress} metaAddress - 66-byte stealth meta-address
 * @param {Uint8Array} ephemeralPrivateKey - 32-byte ephemeral private key
 * @returns {import('./StealthAddressType.js').GenerateStealthAddressResult} Stealth address, ephemeral pubkey, view tag
 * @throws {StealthAddressGenerationError} If generation fails
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 *
 * // Recipient publishes meta-address
 * const metaAddress = StealthAddress.generateMetaAddress(spendingPubKey, viewingPubKey);
 *
 * // Sender generates stealth address
 * const ephemeralPrivKey = new Uint8Array(32);
 * crypto.getRandomValues(ephemeralPrivKey);
 * const result = StealthAddress.generateStealthAddress(metaAddress, ephemeralPrivKey);
 *
 * console.log(result.stealthAddress); // 20-byte address
 * console.log(result.ephemeralPublicKey); // 33-byte compressed pubkey
 * console.log(result.viewTag); // 0-255
 * ```
 */
export function generateStealthAddress(metaAddress: import("./StealthAddressType.js").StealthMetaAddress, ephemeralPrivateKey: Uint8Array): import("./StealthAddressType.js").GenerateStealthAddressResult;
//# sourceMappingURL=generateStealthAddress.d.ts.map
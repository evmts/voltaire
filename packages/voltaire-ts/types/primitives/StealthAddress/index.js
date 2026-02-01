/**
 * ERC-5564 Stealth Address Module
 *
 * Privacy-preserving non-interactive stealth address generation using SECP256k1.
 * Enables senders to generate private addresses that only recipients can detect and spend from.
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564 for ERC-5564 specification
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @example
 * ```typescript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 *
 * // Recipient: Generate key pairs and meta-address
 * const spendingPrivKey = new Uint8Array(32);
 * const viewingPrivKey = new Uint8Array(32);
 * crypto.getRandomValues(spendingPrivKey);
 * crypto.getRandomValues(viewingPrivKey);
 *
 * const spendingPubKey = StealthAddress.compressPublicKey(
 *   Secp256k1.derivePublicKey(spendingPrivKey)
 * );
 * const viewingPubKey = StealthAddress.compressPublicKey(
 *   Secp256k1.derivePublicKey(viewingPrivKey)
 * );
 * const metaAddress = StealthAddress.generateMetaAddress(spendingPubKey, viewingPubKey);
 *
 * // Sender: Generate stealth address
 * const ephemeralPrivKey = new Uint8Array(32);
 * crypto.getRandomValues(ephemeralPrivKey);
 * const { stealthAddress, ephemeralPublicKey, viewTag } =
 *   StealthAddress.generateStealthAddress(metaAddress, ephemeralPrivKey);
 *
 * // Sender publishes: stealthAddress, ephemeralPublicKey, viewTag
 *
 * // Recipient: Check if stealth address is theirs
 * const result = StealthAddress.checkStealthAddress(
 *   viewingPrivKey,
 *   ephemeralPublicKey,
 *   viewTag,
 *   spendingPubKey,
 *   stealthAddress
 * );
 *
 * if (result.isForRecipient) {
 *   // Compute full stealth private key to spend
 *   const stealthPrivKey = StealthAddress.computeStealthPrivateKey(
 *     spendingPrivKey,
 *     result.stealthPrivateKey!
 *   );
 * }
 * ```
 */
export { checkStealthAddress } from "./checkStealthAddress.js";
// Utility functions
export { compressPublicKey } from "./compressPublicKey.js";
export { computeStealthPrivateKey } from "./computeStealthPrivateKey.js";
export { computeViewTag } from "./computeViewTag.js";
// Constants
export * from "./constants.js";
export { decompressPublicKey } from "./decompressPublicKey.js";
// Error exports
export * from "./errors.js";
// Core functions
export { generateMetaAddress } from "./generateMetaAddress.js";
export { generateStealthAddress } from "./generateStealthAddress.js";
export { parseAnnouncement } from "./parseAnnouncement.js";
export { parseMetaAddress } from "./parseMetaAddress.js";

/**
 * Create root HD key from BIP-39 seed.
 *
 * Master key for hierarchical deterministic wallet.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} seed - BIP-39 seed bytes (typically 64 bytes from mnemonic, must be 16-64 bytes)
 * @returns {import('./ExtendedKeyType.js').BrandedExtendedKey} Root extended key for BIP-32 derivation
 * @throws {InvalidSeedError} If seed length is not between 16 and 64 bytes
 * @throws {HDWalletError} If master key derivation fails
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * const seed = new Uint8Array(64); // From BIP-39 mnemonic
 * const root = HDWallet.fromSeed(seed);
 * ```
 */
export function fromSeed(seed: Uint8Array): import("./ExtendedKeyType.js").BrandedExtendedKey;
//# sourceMappingURL=fromSeed.d.ts.map
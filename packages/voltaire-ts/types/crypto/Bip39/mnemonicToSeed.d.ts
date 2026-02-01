/**
 * Convert mnemonic to seed (async)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./MnemonicType.js').Mnemonic} mnemonic - BIP-39 mnemonic phrase
 * @param {string} [passphrase=""] - Optional passphrase for additional security
 * @returns {Promise<import('./SeedType.js').Seed>} 64-byte seed
 * @throws {InvalidMnemonicError} If mnemonic is invalid
 * @throws {Bip39Error} If seed derivation fails
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * const seed = await Bip39.mnemonicToSeed(mnemonic, "my passphrase");
 * ```
 */
export function mnemonicToSeed(mnemonic: import("./MnemonicType.js").Mnemonic, passphrase?: string): Promise<import("./SeedType.js").Seed>;
//# sourceMappingURL=mnemonicToSeed.d.ts.map
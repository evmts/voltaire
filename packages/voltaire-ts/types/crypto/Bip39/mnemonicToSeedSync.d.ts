/**
 * Convert mnemonic to seed (sync)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./MnemonicType.js').Mnemonic} mnemonic - BIP-39 mnemonic phrase
 * @param {string} [passphrase=""] - Optional passphrase for additional security
 * @returns {import('./SeedType.js').Seed} 64-byte seed
 * @throws {InvalidMnemonicError} If mnemonic is invalid
 * @throws {Bip39Error} If seed derivation fails
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * const seed = Bip39.mnemonicToSeedSync(mnemonic);
 * ```
 */
export function mnemonicToSeedSync(mnemonic: import("./MnemonicType.js").Mnemonic, passphrase?: string): import("./SeedType.js").Seed;
//# sourceMappingURL=mnemonicToSeedSync.d.ts.map
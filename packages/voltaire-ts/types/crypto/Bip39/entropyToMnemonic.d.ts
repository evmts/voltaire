/**
 * Generate mnemonic from custom entropy
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./EntropyType.js').Entropy} entropy - Entropy bytes (16, 20, 24, 28, or 32 bytes)
 * @param {string[]} [wl] - Optional wordlist (defaults to English)
 * @returns {import('./MnemonicType.js').Mnemonic} Mnemonic phrase
 * @throws {InvalidEntropyError} If entropy size is invalid
 * @throws {Bip39Error} If conversion fails
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * const entropy = crypto.getRandomValues(new Uint8Array(32));
 * const mnemonic = Bip39.entropyToMnemonic(entropy);
 * ```
 */
export function entropyToMnemonic(entropy: import("./EntropyType.js").Entropy, wl?: string[]): import("./MnemonicType.js").Mnemonic;
//# sourceMappingURL=entropyToMnemonic.d.ts.map
/**
 * Validate mnemonic or throw error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./MnemonicType.js').Mnemonic} mnemonic - Mnemonic phrase to validate
 * @param {string[]} [wl] - Optional wordlist (defaults to English)
 * @returns {void}
 * @throws {InvalidMnemonicError} If mnemonic is invalid
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * try {
 *   Bip39.assertValidMnemonic(mnemonic);
 * } catch (e) {
 *   console.error("Invalid mnemonic:", e.message);
 * }
 * ```
 */
export function assertValidMnemonic(mnemonic: import("./MnemonicType.js").Mnemonic, wl?: string[]): void;
//# sourceMappingURL=assertValidMnemonic.d.ts.map
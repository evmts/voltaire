/**
 * Convert a BIP-39 mnemonic to a seed.
 *
 * @param {string | string[]} mnemonic - Mnemonic words or a space-separated sentence
 * @param {string} [password] - Optional passphrase
 * @returns {Promise<Uint8Array>} 512-bit seed
 * @throws {InvalidMnemonicError} If mnemonic conversion fails
 */
export function mnemonicToSeed(mnemonic: string | string[], password?: string): Promise<Uint8Array>;
//# sourceMappingURL=mnemonicToSeed.d.ts.map
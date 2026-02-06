/**
 * Generate BIP-39 mnemonic from entropy
 *
 * @param {128 | 256} [strength=128] - Entropy strength in bits
 * @returns {Promise<string[]>} Mnemonic words
 * @throws {InvalidMnemonicError} If strength is invalid or generation fails
 */
export function generateMnemonic(strength?: 128 | 256): Promise<string[]>;
//# sourceMappingURL=generateMnemonic.d.ts.map
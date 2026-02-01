/**
 * Get word count from entropy bits
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {number} entropyBits - Entropy in bits
 * @returns {number} Number of words in mnemonic
 * @throws {InvalidEntropyError} If entropy bits value is invalid
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * Bip39.getWordCount(128); // 12
 * Bip39.getWordCount(256); // 24
 * ```
 */
export function getWordCount(entropyBits: number): number;
//# sourceMappingURL=getWordCount.d.ts.map
/**
 * Get entropy bits from word count
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {number} wordCount - Number of words
 * @returns {number} Entropy in bits
 * @throws {Bip39Error} If word count is invalid
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * Bip39.getEntropyBits(12); // 128
 * Bip39.getEntropyBits(24); // 256
 * ```
 */
export function getEntropyBits(wordCount: number): number;
//# sourceMappingURL=getEntropyBits.d.ts.map
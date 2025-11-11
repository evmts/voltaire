/**
 * BIP-39 mnemonic phrase (12-24 words)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```typescript
 * import type { Mnemonic } from './crypto/Bip39/BrandedMnemonic.js';
 * const mnemonic: Mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
 * ```
 */
export type Mnemonic = string;

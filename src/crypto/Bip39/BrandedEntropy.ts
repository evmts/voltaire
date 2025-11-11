/**
 * Entropy bytes for BIP-39 mnemonic generation
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```typescript
 * import type { Entropy } from './crypto/Bip39/BrandedEntropy.js';
 * const entropy: Entropy = crypto.getRandomValues(new Uint8Array(32));
 * ```
 */
export type Entropy = Uint8Array;

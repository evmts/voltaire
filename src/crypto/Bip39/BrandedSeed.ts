/**
 * BIP-39 seed (64 bytes / 512 bits)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```typescript
 * import type { Seed } from './crypto/Bip39/BrandedSeed.js';
 * const seed: Seed = new Uint8Array(64);
 * ```
 */
export type Seed = Uint8Array;

/**
 * X25519 public key (32 bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @example
 * ```typescript
 * import type { PublicKey } from './crypto/X25519/PublicKey.js';
 * const publicKey: PublicKey = new Uint8Array(32);
 * ```
 */
export type PublicKey = Uint8Array;

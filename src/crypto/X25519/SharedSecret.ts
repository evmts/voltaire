/**
 * Shared secret from key exchange (32 bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @example
 * ```typescript
 * import type { SharedSecret } from './crypto/X25519/SharedSecret.js';
 * const shared: SharedSecret = new Uint8Array(32);
 * ```
 */
export type SharedSecret = Uint8Array;

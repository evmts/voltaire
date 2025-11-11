/**
 * X25519 secret key (32 bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @example
 * ```typescript
 * import type { SecretKey } from './crypto/X25519/SecretKey.js';
 * const secretKey: SecretKey = new Uint8Array(32);
 * ```
 */
export type SecretKey = Uint8Array;

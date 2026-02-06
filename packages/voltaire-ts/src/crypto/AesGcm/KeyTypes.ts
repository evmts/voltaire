/**
 * AES-GCM CryptoKey type
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```typescript
 * import type { Key } from './crypto/AesGcm/KeyTypes.js';
 * const key: Key = await crypto.subtle.generateKey(...);
 * ```
 */
export type Key = CryptoKey;

/**
 * Raw key material (bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```typescript
 * import type { KeyMaterial } from './crypto/AesGcm/KeyTypes.js';
 * const material: KeyMaterial = new Uint8Array(32);
 * ```
 */
export type KeyMaterial = Uint8Array;

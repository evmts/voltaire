/**
 * Uncompressed public key (64 bytes)
 *
 * Format: x-coordinate (32 bytes) || y-coordinate (32 bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export type BrandedP256PublicKey = Uint8Array;

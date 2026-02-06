/**
 * Ed25519 secret key (32 bytes)
 * Note: Some implementations use 64-byte secret keys (32 seed + 32 prefix),
 * but @noble/curves uses 32-byte seeds
 */
export type SecretKey = Uint8Array;

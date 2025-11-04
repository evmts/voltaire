/**
 * ECDSA signature (r, s components)
 *
 * Components:
 * - r: x-coordinate of the ephemeral public key (32 bytes)
 * - s: signature proof value (32 bytes)
 */
export type BrandedP256Signature = {
	r: Uint8Array;
	s: Uint8Array;
};

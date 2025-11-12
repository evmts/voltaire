/**
 * ECDSA signature (r, s components)
 *
 * Components:
 * - r: x-coordinate of the ephemeral public key (32 bytes, BrandedHash)
 * - s: signature proof value (32 bytes, BrandedHash)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export type BrandedP256Signature = {
	r: import("../../primitives/Hash/index.js").BrandedHash;
	s: import("../../primitives/Hash/index.js").BrandedHash;
};

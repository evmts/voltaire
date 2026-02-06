/**
 * ECDSA signature (r, s components)
 *
 * Components:
 * - r: x-coordinate of the ephemeral public key (32 bytes, HashType)
 * - s: signature proof value (32 bytes, HashType)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export type P256SignatureType = {
	r: import("../../primitives/Hash/index.js").HashType;
	s: import("../../primitives/Hash/index.js").HashType;
};

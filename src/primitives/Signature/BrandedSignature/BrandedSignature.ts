/**
 * Algorithm types supported by the Signature primitive
 */
export type SignatureAlgorithm = "secp256k1" | "p256" | "ed25519";

/**
 * Unified signature type with algorithm tagging
 *
 * Structure:
 * - For ECDSA (secp256k1, p256): r (32 bytes) + s (32 bytes) + optional v (1 byte for secp256k1)
 * - For Ed25519: signature (64 bytes)
 *
 * Algorithm is tracked in metadata, not in the bytes
 */
export type BrandedSignature = Uint8Array & {
	readonly __tag: "Signature";
	readonly algorithm: SignatureAlgorithm;
	readonly v?: number; // Recovery ID for secp256k1 (27 or 28)
};

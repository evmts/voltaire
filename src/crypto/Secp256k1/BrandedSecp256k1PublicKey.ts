import type { brand } from "../../brand.js";

/**
 * Branded secp256k1 public key type - 64 byte uncompressed public key
 *
 * Format: x-coordinate (32 bytes) || y-coordinate (32 bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export type BrandedSecp256k1PublicKey = Uint8Array & {
	readonly [brand]: "Secp256k1PublicKey";
	readonly length: 64;
};

import { secp256k1 } from "@noble/curves/secp256k1";
import type { BrandedPublicKey } from "./BrandedPublicKey.js";
import type { BrandedPrivateKey } from "../../PrivateKey/BrandedPrivateKey/BrandedPrivateKey.js";

/**
 * Derive public key from private key
 *
 * @param privateKey - Private key
 * @returns Public key (64 bytes uncompressed)
 *
 * @example
 * ```typescript
 * const publicKey = PublicKey.fromPrivateKey(pk);
 * ```
 */
export function fromPrivateKey(
	privateKey: BrandedPrivateKey,
): BrandedPublicKey {
	// Get uncompressed public key (65 bytes with 0x04 prefix)
	const fullKey = secp256k1.getPublicKey(privateKey, false);
	// Remove 0x04 prefix to get 64 bytes
	return fullKey.slice(1) as BrandedPublicKey;
}

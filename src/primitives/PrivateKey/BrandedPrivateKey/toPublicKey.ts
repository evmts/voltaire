import { secp256k1 } from "@noble/curves/secp256k1.js";
import type { BrandedPrivateKey } from "./BrandedPrivateKey.js";
import type { BrandedPublicKey } from "../../PublicKey/BrandedPublicKey/BrandedPublicKey.js";

/**
 * Derive public key from private key
 *
 * @param this - Private key
 * @returns Public key (uncompressed 64 bytes)
 *
 * @example
 * ```typescript
 * const publicKey = PrivateKey._toPublicKey.call(pk);
 * ```
 */
export function toPublicKey(this: BrandedPrivateKey): BrandedPublicKey {
	// Get uncompressed public key (65 bytes with 0x04 prefix)
	const fullKey = secp256k1.getPublicKey(this, false);
	// Remove 0x04 prefix to get 64 bytes
	return fullKey.slice(1) as BrandedPublicKey;
}

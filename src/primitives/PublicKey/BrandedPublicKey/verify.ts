import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import type { BrandedPublicKey } from "./BrandedPublicKey.js";
import type { BrandedHash } from "../../Hash/BrandedHash/BrandedHash.js";
import type { BrandedSignature } from "../../Signature/BrandedSignature/BrandedSignature.js";

/**
 * Verify signature against public key
 *
 * @param this - Public key
 * @param hash - Message hash
 * @param signature - ECDSA signature
 * @returns True if signature is valid
 *
 * @example
 * ```typescript
 * const valid = PublicKey._verify.call(pk, hash, sig);
 * ```
 */
export function verify(
	this: BrandedPublicKey,
	hash: BrandedHash,
	signature: BrandedSignature,
): boolean {
	// Add 0x04 prefix for uncompressed key
	const fullKey = new Uint8Array(65);
	fullKey[0] = 0x04;
	fullKey.set(this, 1);

	return Secp256k1.verify(signature, hash, fullKey);
}

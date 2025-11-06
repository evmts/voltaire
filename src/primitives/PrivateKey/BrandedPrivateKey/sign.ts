import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import type { BrandedPrivateKey } from "./BrandedPrivateKey.js";
import type { BrandedHash } from "../../Hash/BrandedHash/BrandedHash.js";
import type { BrandedSignature } from "../../Signature/BrandedSignature/BrandedSignature.js";

/**
 * Sign a message hash with private key
 *
 * @param this - Private key
 * @param hash - Message hash to sign
 * @returns ECDSA signature
 *
 * @example
 * ```typescript
 * const sig = PrivateKey._sign.call(pk, hash);
 * ```
 */
export function sign(
	this: BrandedPrivateKey,
	hash: BrandedHash,
): BrandedSignature {
	return Secp256k1.sign(hash, this);
}

import { Secp256k1 } from "../../../crypto/secp256k1.js";
import type { BrandedAuthorization } from "./BrandedAuthorization.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify authorization signature
 */
export function verifySignature(auth: BrandedAuthorization): boolean {
	try {
		const signingHash = getSigningHash(auth);
		const v = 27 + auth.yParity;
		const publicKey = Secp256k1.recoverPublicKey(
			{ r: auth.r, s: auth.s, v },
			signingHash,
		);
		return Secp256k1.verify(
			{ r: auth.r, s: auth.s, v },
			signingHash,
			publicKey,
		);
	} catch {
		return false;
	}
}

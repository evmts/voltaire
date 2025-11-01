import { Secp256k1 } from "../../../crypto/secp256k1.js";
import type { EIP2930 } from "../types.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify transaction signature
 */
export function verifySignature(this: EIP2930): boolean {
	try {
		const signingHash = getSigningHash.call(this);
		const v = 27 + this.yParity;
		const publicKey = Secp256k1.recoverPublicKey(
			{ r: this.r, s: this.s, v },
			signingHash,
		);
		return Secp256k1.verify(
			{ r: this.r, s: this.s, v },
			signingHash,
			publicKey,
		);
	} catch {
		return false;
	}
}

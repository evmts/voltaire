import { Secp256k1 } from "../../../crypto/secp256k1.js";
import type { Legacy } from "../types.js";
import { getChainId } from "./getChainId.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify transaction signature
 */
export function verifySignature(this: Legacy): boolean {
	try {
		const signingHash = getSigningHash.call(this);

		// Convert v to recovery bit
		const chainId = getChainId.call(this);
		let v: number;
		if (chainId !== null) {
			v = Number(this.v - chainId * 2n - 35n);
		} else {
			v = Number(this.v);
		}

		// Recover public key
		const publicKey = Secp256k1.recoverPublicKey(
			{ r: this.r, s: this.s, v },
			signingHash,
		);

		// Verify signature
		return Secp256k1.verify(
			{ r: this.r, s: this.s, v },
			signingHash,
			publicKey,
		);
	} catch {
		return false;
	}
}

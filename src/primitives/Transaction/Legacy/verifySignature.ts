import { Secp256k1 } from "../../../crypto/secp256k1.js";
import type { BrandedTransactionLegacy } from "./BrandedTransactionLegacy.js";
import { getChainId } from "./getChainId.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify transaction signature
 */
export function verifySignature(tx: BrandedTransactionLegacy): boolean {
	try {
		const signingHash = getSigningHash(tx);

		// Convert v to recovery bit
		const chainId = getChainId(tx);
		let v: number;
		if (chainId !== null) {
			v = Number(tx.v - chainId * 2n - 35n);
		} else {
			v = Number(tx.v);
		}

		// Recover public key
		const publicKey = Secp256k1.recoverPublicKey(
			{ r: tx.r, s: tx.s, v },
			signingHash,
		);

		// Verify signature
		return Secp256k1.verify(
			{ r: tx.r, s: tx.s, v },
			signingHash,
			publicKey,
		);
	} catch {
		return false;
	}
}

import { Secp256k1 } from "../../../crypto/secp256k1.js";
import type { BrandedTransactionEIP2930 } from "./BrandedTransactionEIP2930.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Verify transaction signature
 */
export function verifySignature(tx: BrandedTransactionEIP2930): boolean {
	try {
		const signingHash = getSigningHash(tx);
		const v = 27 + tx.yParity;
		const publicKey = Secp256k1.recoverPublicKey(
			{ r: tx.r, s: tx.s, v },
			signingHash,
		);
		return Secp256k1.verify(
			{ r: tx.r, s: tx.s, v },
			signingHash,
			publicKey,
		);
	} catch {
		return false;
	}
}

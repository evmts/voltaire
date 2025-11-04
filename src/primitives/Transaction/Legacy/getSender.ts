import type { Address } from "../../Address/index.js";
import type { BrandedTransactionLegacy } from "./BrandedTransactionLegacy.js";
import { recoverAddress } from "../utils.js";
import { getChainId } from "./getChainId.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from signature
 */
export function getSender(tx: BrandedTransactionLegacy): Address {
	const signingHash = getSigningHash(tx);

	// Convert EIP-155 v to recovery bit
	const chainId = getChainId(tx);
	let v: number;
	if (chainId !== null) {
		// EIP-155: v = chainId * 2 + 35 + recoveryBit
		v = Number(tx.v - chainId * 2n - 35n);
	} else {
		// Pre-EIP-155: v = 27 + recoveryBit
		v = Number(tx.v);
	}

	return recoverAddress({ r: tx.r, s: tx.s, v }, signingHash);
}

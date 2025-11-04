import { recoverAddress } from "../utils.js";
import { getChainId } from "./getChainId.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from signature
 *
 * @this {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy}
 * @returns {import('../../Address/index.js').BrandedAddress} Sender address recovered from signature
 *
 * @example
 * ```typescript
 * const sender = TransactionLegacy.getSender.call(tx);
 * ```
 */
export function getSender() {
	const signingHash = getSigningHash.call(this);

	// Convert EIP-155 v to recovery bit
	const chainId = getChainId.call(this);
	let v;
	if (chainId !== null) {
		// EIP-155: v = chainId * 2 + 35 + recoveryBit
		v = Number(this.v - chainId * 2n - 35n);
	} else {
		// Pre-EIP-155: v = 27 + recoveryBit
		v = Number(this.v);
	}

	return recoverAddress({ r: this.r, s: this.s, v }, signingHash);
}

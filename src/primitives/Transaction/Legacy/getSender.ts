import type { Address } from "../../Address/index.js";
import type { Legacy } from "../types.js";
import { recoverAddress } from "../utils.js";
import { getChainId } from "./getChainId.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from signature
 */
export function getSender(this: Legacy): Address {
	const signingHash = getSigningHash.call(this);

	// Convert EIP-155 v to recovery bit
	const chainId = getChainId.call(this);
	let v: number;
	if (chainId !== null) {
		// EIP-155: v = chainId * 2 + 35 + recoveryBit
		v = Number(this.v - chainId * 2n - 35n);
	} else {
		// Pre-EIP-155: v = 27 + recoveryBit
		v = Number(this.v);
	}

	return recoverAddress({ r: this.r, s: this.s, v }, signingHash);
}

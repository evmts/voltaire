import { recoverAddress } from "../utils.js";
import { getChainId } from "./getChainId.js";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get sender address from transaction signature (Legacy).
 *
 * Recovers the sender address from transaction signature components (r, s, v).
 * Returns a BrandedAddress (20 bytes). Handles both EIP-155 (chainId in v) and
 * pre-EIP-155 signatures. Assumes transaction uses branded types with validated
 * signature components.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @this {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy}
 * @returns {import('../../Address/index.js').BrandedAddress} Sender address (20 bytes, branded)
 * @throws {Error} If signature recovery fails
 * @example
 * ```javascript
 * import { getSender } from './primitives/Transaction/Legacy/getSender.js';
 * const sender = getSender.call(tx);
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

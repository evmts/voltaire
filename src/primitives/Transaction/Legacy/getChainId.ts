import type { Legacy } from "../types.js";

/**
 * Extract chain ID from v value (EIP-155)
 */
export function getChainId(this: Legacy): bigint | null {
	// EIP-155: chainId = (v - 35) / 2 (if v >= 35)
	// Pre-EIP-155: null
	if (this.v < 35n) return null;
	return (this.v - 35n) / 2n;
}

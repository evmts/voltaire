import type { BrandedTransactionLegacy } from "./BrandedTransactionLegacy.js";

/**
 * Extract chain ID from v value (EIP-155)
 */
export function getChainId(tx: BrandedTransactionLegacy): bigint | null {
	// EIP-155: chainId = (v - 35) / 2 (if v >= 35)
	// Pre-EIP-155: null
	if (tx.v < 35n) return null;
	return (tx.v - 35n) / 2n;
}

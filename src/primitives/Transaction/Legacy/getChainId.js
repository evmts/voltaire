/**
 * Extract chain ID from v value (EIP-155)
 *
 * @this {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy}
 * @returns {bigint | null} Chain ID if EIP-155, null if pre-EIP-155
 *
 * @example
 * ```typescript
 * const chainId = TransactionLegacy.getChainId.call(tx);
 * // EIP-155: chainId = (v - 35) / 2 (if v >= 35)
 * // Pre-EIP-155: null
 * ```
 */
export function getChainId() {
	// EIP-155: chainId = (v - 35) / 2 (if v >= 35)
	// Pre-EIP-155: null
	if (this.v < 35n) return null;
	return (this.v - 35n) / 2n;
}

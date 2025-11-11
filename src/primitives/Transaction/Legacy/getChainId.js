/**
 * Extract chain ID from v value (EIP-155).
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @this {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy}
 * @returns {bigint | null} Chain ID if EIP-155, null if pre-EIP-155
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getChainId } from './primitives/Transaction/Legacy/getChainId.js';
 * const chainId = getChainId.call(tx);
 * ```
 */
export function getChainId() {
	// EIP-155: chainId = (v - 35) / 2 (if v >= 35)
	// Pre-EIP-155: null
	if (this.v < 35n) return null;
	return (this.v - 35n) / 2n;
}

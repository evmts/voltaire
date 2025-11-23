/**
 * Extract chain ID from v value (EIP-155).
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @this {import('./TransactionLegacyType.js').TransactionLegacyType}
 * @returns {bigint | null} Chain ID if EIP-155, null if pre-EIP-155
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getChainId } from './primitives/Transaction/Legacy/getChainId.js';
 * const chainId = getChainId.call(tx);
 * ```
 */
export function getChainId() {
	// EIP-155: v = chainId * 2 + 35 + recoveryBit (if v >= 35)
	// Pre-EIP-155: v = 27 + recoveryBit (v is 27 or 28)
	if (this.v < 35n) return null;

	// Extract chainId accounting for recovery bit (0 or 1)
	// Since v = chainId * 2 + 35 + recoveryBit, we have:
	// chainId = (v - 35 - recoveryBit) / 2
	// To get chainId without knowing recoveryBit, use integer division:
	// (v - 35) / 2 works because integer division floors the result
	return (this.v - 35n) / 2n;
}

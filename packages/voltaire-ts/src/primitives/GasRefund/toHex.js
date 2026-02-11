/**
 * Convert GasRefund to hex string
 *
 * @this {import('./GasRefundType.js').GasRefundType}
 * @returns {import('../Hex/HexType.js').HexType} Gas refund as hex string (0x prefixed)
 *
 * @example
 * ```typescript
 * const refund = GasRefund.from(15000n);
 * GasRefund.toHex(refund); // "0x3a98"
 * ```
 */
export function toHex() {
	return /** @type {import('../Hex/HexType.js').HexType} */ (
		`0x${this.toString(16)}`
	);
}

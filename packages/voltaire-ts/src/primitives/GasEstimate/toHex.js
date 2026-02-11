/**
 * Convert GasEstimate to hex string
 *
 * @this {import('./GasEstimateType.js').GasEstimateType}
 * @returns {import('../Hex/HexType.js').HexType} Gas estimate as hex string (0x prefixed)
 *
 * @example
 * ```typescript
 * const estimate = GasEstimate.from(51234n);
 * GasEstimate.toHex(estimate); // "0xc822"
 * ```
 */
export function toHex() {
	return /** @type {import('../Hex/HexType.js').HexType} */ (
		`0x${this.toString(16)}`
	);
}

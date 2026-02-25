/**
 * Convert GasUsed to hex string
 *
 * @this {import('./GasUsedType.js').GasUsedType}
 * @returns {import('../Hex/HexType.js').HexType} Gas used as hex string (0x prefixed)
 *
 * @example
 * ```typescript
 * const gasUsed = GasUsed.from(51234n);
 * GasUsed.toHex(gasUsed); // "0xc822"
 * ```
 */
export function toHex() {
	return /** @type {import('../Hex/HexType.js').HexType} */ (
		`0x${this.toString(16)}`
	);
}

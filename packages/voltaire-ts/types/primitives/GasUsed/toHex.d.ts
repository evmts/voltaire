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
export function toHex(this: import("./GasUsedType.js").GasUsedType): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map
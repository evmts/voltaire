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
export function toHex(this: import("./GasEstimateType.js").GasEstimateType): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map
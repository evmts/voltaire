/**
 * Convert Paymaster to hex string
 *
 * @param {import('./PaymasterType.js').PaymasterType} paymaster - Paymaster address
 * @returns {import('../Hex/HexType.js').HexType} Hex string (0x-prefixed)
 *
 * @example
 * ```typescript
 * const hex = Paymaster.toHex(paymaster);
 * console.log(hex); // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 */
export function toHex(paymaster: import("./PaymasterType.js").PaymasterType): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map
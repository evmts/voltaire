/**
 * Create ChainId from number
 *
 * @param {number} value - Chain ID number
 * @returns {import('./ChainIdType.js').ChainIdType} Branded chain ID
 * @throws {InvalidFormatError} If value is not a non-negative integer
 *
 * @example
 * ```typescript
 * const mainnet = ChainId.from(1);
 * const sepolia = ChainId.from(11155111);
 * ```
 */
export function from(value: number): import("./ChainIdType.js").ChainIdType;
//# sourceMappingURL=from.d.ts.map
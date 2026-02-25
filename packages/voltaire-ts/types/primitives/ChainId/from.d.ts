/**
 * Create ChainId from number or bigint
 *
 * @param {number | bigint} value - Chain ID number or bigint
 * @returns {import('./ChainIdType.js').ChainIdType} Branded chain ID
 * @throws {InvalidFormatError} If value is not a non-negative integer
 *
 * @example
 * ```typescript
 * const mainnet = ChainId.from(1);
 * const fromBigint = ChainId.from(1n);
 * const sepolia = ChainId.from(11155111);
 * ```
 */
export function from(value: number | bigint): import("./ChainIdType.js").ChainIdType;
//# sourceMappingURL=from.d.ts.map
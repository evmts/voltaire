/**
 * Create ChainHead from block data or RPC response
 *
 * @param {{ number: bigint | number | string; hash: import('../BlockHash/BlockHashType.js').BlockHashType | string; timestamp: bigint | number | string; difficulty?: bigint | number | string; totalDifficulty?: bigint | number | string }} value - Chain head data
 * @returns {import('./ChainHeadType.js').ChainHeadType} ChainHead
 *
 * @example
 * ```typescript
 * const head = ChainHead.from({
 *   number: 18000000n,
 *   hash: blockHash,
 *   timestamp: 1699000000n,
 * });
 * ```
 */
export function from(value: {
    number: bigint | number | string;
    hash: import("../BlockHash/BlockHashType.js").BlockHashType | string;
    timestamp: bigint | number | string;
    difficulty?: bigint | number | string;
    totalDifficulty?: bigint | number | string;
}): import("./ChainHeadType.js").ChainHeadType;
//# sourceMappingURL=from.d.ts.map
/**
 * Calculate series of future base fees (standard form)
 *
 * Useful for estimating fee trends over multiple blocks.
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('./FeeMarketType.js').FeeMarketType} initialState - Starting state
 * @param {number} blocks - Number of blocks to project
 * @param {bigint} avgGasUsed - Average gas used per block
 * @param {bigint} [avgBlobGasUsed=0n] - Average blob gas used per block
 * @returns {bigint[]} Array of future base fees
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const fees = FeeMarket.projectBaseFees(
 *   { gasUsed: 15_000_000n, gasLimit: 30_000_000n, baseFee: 1_000_000_000n,
 *     excessBlobGas: 0n, blobGasUsed: 0n },
 *   10,
 *   25_000_000n,
 *   262144n
 * );
 * ```
 */
export function projectBaseFees(initialState: import("./FeeMarketType.js").FeeMarketType, blocks: number, avgGasUsed: bigint, avgBlobGasUsed?: bigint): bigint[];
//# sourceMappingURL=projectBaseFees.d.ts.map
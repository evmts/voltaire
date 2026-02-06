/**
 * Calculate next block's fee market state (standard form)
 *
 * Updates both EIP-1559 base fee and EIP-4844 blob base fee components.
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('./FeeMarketType.js').FeeMarketType} state - Current block state
 * @returns {import('./FeeMarketType.js').FeeMarketType} Next block's state
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const currentState = {
 *   gasUsed: 20_000_000n,
 *   gasLimit: 30_000_000n,
 *   baseFee: 1_000_000_000n,
 *   excessBlobGas: 0n,
 *   blobGasUsed: 262144n
 * };
 * const next = FeeMarket.nextState(currentState);
 * ```
 */
export function nextState(state: import("./FeeMarketType.js").FeeMarketType): import("./FeeMarketType.js").FeeMarketType;
//# sourceMappingURL=nextState.d.ts.map
/**
 * Validate block state
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('./FeeMarketType.js').FeeMarketType} state - Block state
 * @returns {string[]} Validation errors, empty array if valid
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const state = { gasUsed: 0n, gasLimit: 30000000n, baseFee: 1000000000n, excessBlobGas: 0n, blobGasUsed: 0n };
 * const errors = FeeMarket.validateState(state);
 * ```
 */
export function validateState(state: import("./FeeMarketType.js").FeeMarketType): string[];
//# sourceMappingURL=validateState.d.ts.map
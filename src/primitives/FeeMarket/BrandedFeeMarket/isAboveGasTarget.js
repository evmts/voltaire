// @ts-nocheck
import * as Eip1559 from "../eip1559Constants.js";

/**
 * Check if block is above gas target (takes this)
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('../BrandedState.js').BrandedState} state - Current block state
 * @returns {boolean} True if gas used exceeds 50% of gas limit
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const state = { gasUsed: 20000000n, gasLimit: 30000000n, baseFee: 1000000000n, excessBlobGas: 0n, blobGasUsed: 0n };
 * const isAbove = FeeMarket.isAboveGasTarget(state);
 * ```
 */
export function isAboveGasTarget(state) {
	return state.gasUsed > state.gasLimit / Eip1559.ELASTICITY_MULTIPLIER;
}

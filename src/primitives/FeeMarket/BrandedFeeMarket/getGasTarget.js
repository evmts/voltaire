// @ts-nocheck
import * as Eip1559 from "../eip1559Constants.js";

/**
 * Get gas target for block (takes this)
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('../BrandedState.js').BrandedState} state - Current block state
 * @returns {bigint} Gas target (50% of gas limit)
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const state = { gasUsed: 0n, gasLimit: 30000000n, baseFee: 1000000000n, excessBlobGas: 0n, blobGasUsed: 0n };
 * const target = FeeMarket.getGasTarget(state);
 * ```
 */
export function getGasTarget(state) {
	return state.gasLimit / Eip1559.ELASTICITY_MULTIPLIER;
}

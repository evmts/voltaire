// @ts-nocheck
import * as Eip4844 from "../eip4844Constants.js";

/**
 * Check if block is above blob gas target (takes this)
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('../BrandedState.js').BrandedState} state - Current block state
 * @returns {boolean} True if blob gas used exceeds target
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const state = { excessBlobGas: 0n, blobGasUsed: 524288n, gasUsed: 0n, gasLimit: 30000000n, baseFee: 1000000000n };
 * const isAbove = FeeMarket.isAboveBlobGasTarget(state);
 * ```
 */
export function isAboveBlobGasTarget(state) {
	return state.blobGasUsed > Eip4844.TARGET_BLOB_GAS_PER_BLOCK;
}

// @ts-nocheck
import { calculateBlobBaseFee } from "./calculateBlobBaseFee.js";

/**
 * Get current blob base fee (takes this)
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('../BrandedState.js').BrandedState} state - Current block state
 * @returns {bigint} Blob base fee in wei per blob gas
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const state = { excessBlobGas: 393216n, blobGasUsed: 0n, gasUsed: 0n, gasLimit: 30000000n, baseFee: 1000000000n };
 * const blobBaseFee = FeeMarket.getBlobBaseFee(state);
 * ```
 */
export function getBlobBaseFee(state) {
	return calculateBlobBaseFee(state.excessBlobGas);
}

// @ts-nocheck
import * as Eip4844 from "../eip4844Constants.js";

/**
 * Calculate excess blob gas for next block using EIP-4844 formula (standard form)
 *
 * Formula: max(0, parentExcessBlobGas + parentBlobGasUsed - TARGET_BLOB_GAS_PER_BLOCK)
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {bigint} parentExcessBlobGas - Excess blob gas from parent block
 * @param {bigint} parentBlobGasUsed - Blob gas used in parent block
 * @returns {bigint} Excess blob gas for next block
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * // Below target: no excess
 * const excess1 = FeeMarket.calculateExcessBlobGas(0n, 131072n); // 1 blob
 * // excess1 === 0n
 * ```
 */
export function calculateExcessBlobGas(parentExcessBlobGas, parentBlobGasUsed) {
	const total = parentExcessBlobGas + parentBlobGasUsed;

	if (total < Eip4844.TARGET_BLOB_GAS_PER_BLOCK) {
		return 0n;
	}

	return total - Eip4844.TARGET_BLOB_GAS_PER_BLOCK;
}

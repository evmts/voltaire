import { BlobBaseFee } from "./BlobBaseFee.js";
import { resolveBlobContext } from "./resolveBlobContext.js";

/**
 * Get current blob base fee (takes this)
 *
 * Without `context`, uses Cancun's update fraction (backwards compatible).
 * With `context`, uses the update fraction of the resolved schedule
 * (`schedule` > `timestamp` > `hardfork`).
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('./FeeMarketType.js').FeeMarketType} state - Current block state
 * @param {import('./BlobScheduleType.js').BlobForkContext} [context] - Optional fork, timestamp, or schedule context
 * @returns {bigint} Blob base fee in wei per blob gas
 * @throws {InvalidRangeError} If `context` names an unknown or pre-Cancun fork
 * @throws {InvalidFormatError} If `context.timestamp` is an invalid number
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const state = { excessBlobGas: 393216n, blobGasUsed: 0n, gasUsed: 0n, gasLimit: 30000000n, baseFee: 1000000000n };
 * const blobBaseFee = FeeMarket.getBlobBaseFee(state);
 * ```
 */
export function getBlobBaseFee(state, context) {
	if (context === undefined) return BlobBaseFee(state.excessBlobGas);
	return BlobBaseFee(state.excessBlobGas, resolveBlobContext(context).schedule);
}

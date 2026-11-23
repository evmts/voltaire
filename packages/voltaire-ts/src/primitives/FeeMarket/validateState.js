// @ts-nocheck

import * as BlobSchedule from "./blobSchedule.js";
import * as Eip4844 from "./eip4844Constants.js";
import { resolveBlobContext } from "./resolveBlobContext.js";

/**
 * Validate block state
 *
 * Without `context`, the blob gas limit is Cancun's 6 blobs (backwards
 * compatible). With `context`, the limit is `schedule.max` blobs for the
 * fork resolved from `schedule` > `timestamp` > `hardfork` (Prague/Osaka 9,
 * BPO1 15, BPO2 21).
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('./FeeMarketType.js').FeeMarketType} state - Block state
 * @param {import('./BlobScheduleType.js').BlobForkContext} [context] - Optional fork, timestamp, or schedule context
 * @returns {string[]} Validation errors, empty array if valid
 * @throws {InvalidRangeError} If `context` names an unknown or pre-Cancun fork
 * @throws {InvalidFormatError} If `context.timestamp` is an invalid number
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const state = { gasUsed: 0n, gasLimit: 30000000n, baseFee: 1000000000n, excessBlobGas: 0n, blobGasUsed: 0n };
 * const errors = FeeMarket.validateState(state);
 * ```
 */
export function validateState(state, context) {
	const errors = [];
	const maxBlobGasPerBlock =
		context === undefined
			? Eip4844.MAX_BLOB_GAS_PER_BLOCK
			: BlobSchedule.GAS_PER_BLOB * resolveBlobContext(context).schedule.max;

	if (state.gasUsed < 0n) {
		errors.push("gasUsed must be non-negative");
	}

	if (state.gasLimit <= 0n) {
		errors.push("gasLimit must be positive");
	}

	if (state.gasUsed > state.gasLimit) {
		errors.push("gasUsed cannot exceed gasLimit");
	}

	if (state.baseFee < 0n) {
		errors.push("baseFee must be non-negative");
	}

	if (state.excessBlobGas < 0n) {
		errors.push("excessBlobGas must be non-negative");
	}

	if (state.blobGasUsed < 0n) {
		errors.push("blobGasUsed must be non-negative");
	}

	if (state.blobGasUsed > maxBlobGasPerBlock) {
		errors.push(`blobGasUsed cannot exceed ${maxBlobGasPerBlock}`);
	}

	return errors;
}

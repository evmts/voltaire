// @ts-nocheck
import * as Eip1559 from "../eip1559Constants.js";
import * as Eip4844 from "../eip4844Constants.js";

/**
 * Validate block state
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('../BrandedState.js').BrandedState} state - Block state
 * @returns {string[]} Validation errors, empty array if valid
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const state = { gasUsed: 0n, gasLimit: 30000000n, baseFee: 1000000000n, excessBlobGas: 0n, blobGasUsed: 0n };
 * const errors = FeeMarket.validateState(state);
 * ```
 */
export function validateState(state) {
	const errors = [];

	if (state.gasUsed < 0n) {
		errors.push("gasUsed must be non-negative");
	}

	if (state.gasLimit <= 0n) {
		errors.push("gasLimit must be positive");
	}

	if (state.gasUsed > state.gasLimit) {
		errors.push("gasUsed cannot exceed gasLimit");
	}

	if (state.baseFee < Eip1559.MIN_BASE_FEE) {
		errors.push(`baseFee must be at least ${Eip1559.MIN_BASE_FEE}`);
	}

	if (state.excessBlobGas < 0n) {
		errors.push("excessBlobGas must be non-negative");
	}

	if (state.blobGasUsed < 0n) {
		errors.push("blobGasUsed must be non-negative");
	}

	if (state.blobGasUsed > Eip4844.MAX_BLOB_GAS_PER_BLOCK) {
		errors.push(`blobGasUsed cannot exceed ${Eip4844.MAX_BLOB_GAS_PER_BLOCK}`);
	}

	return errors;
}

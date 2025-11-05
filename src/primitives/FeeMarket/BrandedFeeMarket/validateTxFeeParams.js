// @ts-nocheck
import * as Eip4844 from "../eip4844Constants.js";

/**
 * Validate transaction fee parameters
 *
 * @param {import('../TxFeeParams.js').TxFeeParams | import('../BlobTxFeeParams.js').BlobTxFeeParams} params - Transaction fee parameters
 * @returns {string[]} Validation errors, empty array if valid
 */
export function validateTxFeeParams(params) {
	const errors = [];

	if (params.maxFeePerGas < 0n) {
		errors.push("maxFeePerGas must be non-negative");
	}

	if (params.maxPriorityFeePerGas < 0n) {
		errors.push("maxPriorityFeePerGas must be non-negative");
	}

	if (params.maxPriorityFeePerGas > params.maxFeePerGas) {
		errors.push("maxPriorityFeePerGas cannot exceed maxFeePerGas");
	}

	if (params.baseFee < 0n) {
		errors.push("baseFee must be non-negative");
	}

	if ("maxFeePerBlobGas" in params) {
		if (params.maxFeePerBlobGas < 0n) {
			errors.push("maxFeePerBlobGas must be non-negative");
		}

		if (params.blobBaseFee < 0n) {
			errors.push("blobBaseFee must be non-negative");
		}

		if (
			params.blobCount < 1n ||
			params.blobCount > Eip4844.MAX_BLOBS_PER_BLOCK
		) {
			errors.push(
				`blobCount must be between 1 and ${Eip4844.MAX_BLOBS_PER_BLOCK}`,
			);
		}
	}

	return errors;
}

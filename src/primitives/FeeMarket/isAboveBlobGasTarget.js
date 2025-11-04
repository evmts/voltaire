// @ts-nocheck
import * as Eip4844 from "./eip4844Constants.js";

/**
 * Check if block is above blob gas target (takes this)
 * @param {import('./BrandedState.js').BrandedState} state
 * @returns {boolean}
 */
export function isAboveBlobGasTarget(state) {
	return state.blobGasUsed > Eip4844.TARGET_BLOB_GAS_PER_BLOCK;
}

// @ts-nocheck
import { calculateBlobBaseFee } from "./calculateBlobBaseFee.js";

/**
 * Get current blob base fee (takes this)
 * @param {import('./BrandedState.js').BrandedState} state
 * @returns {bigint}
 */
export function getBlobBaseFee(state) {
	return calculateBlobBaseFee(state.excessBlobGas);
}

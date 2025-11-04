// @ts-nocheck
import * as Eip1559 from "./eip1559Constants.js";

/**
 * Check if block is above gas target (takes this)
 * @param {import('./BrandedState.js').BrandedState} state
 * @returns {boolean}
 */
export function isAboveGasTarget(state) {
	return state.gasUsed > state.gasLimit / Eip1559.ELASTICITY_MULTIPLIER;
}

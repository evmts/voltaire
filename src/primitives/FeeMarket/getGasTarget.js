// @ts-nocheck
import * as Eip1559 from "./eip1559Constants.js";

/**
 * Get gas target for block (takes this)
 * @param {import('./BrandedState.js').BrandedState} state
 * @returns {bigint}
 */
export function getGasTarget(state) {
	return state.gasLimit / Eip1559.ELASTICITY_MULTIPLIER;
}

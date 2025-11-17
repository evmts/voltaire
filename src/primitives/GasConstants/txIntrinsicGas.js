import { calculateTxIntrinsicGas } from "./calculateTxIntrinsicGas.js";

/**
 * Calculate transaction intrinsic gas cost (convenience form with this:)
 *
 * @this {{ data: Uint8Array; isCreate: boolean }}
 * @returns {bigint}
 */
export function txIntrinsicGas() {
	return calculateTxIntrinsicGas(this.data, this.isCreate);
}

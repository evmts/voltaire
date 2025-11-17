import { calculateCallCost } from "./calculateCallCost.js";

/**
 * Calculate CALL operation gas cost (convenience form with this:)
 *
 * @this {{ isWarm: boolean; hasValue: boolean; isNewAccount: boolean; availableGas: bigint }}
 * @returns {{ base: bigint; dynamic: bigint; stipend: bigint; forwarded: bigint; total: bigint }}
 */
export function callCost() {
	return calculateCallCost(
		this.isWarm,
		this.hasValue,
		this.isNewAccount,
		this.availableGas,
	);
}

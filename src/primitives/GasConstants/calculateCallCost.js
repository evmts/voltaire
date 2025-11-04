import { WarmStorageRead, ColdAccountAccess, CallValueTransfer, CallNewAccount, CallStipend, CallGasRetentionDivisor } from "./constants.js";

/**
 * Calculate CALL operation gas cost
 *
 * @param {boolean} isWarm - Whether target account is warm
 * @param {boolean} hasValue - Whether call transfers value
 * @param {boolean} isNewAccount - Whether target account doesn't exist
 * @param {bigint} availableGas - Gas available for the call
 * @returns {{ base: bigint; dynamic: bigint; stipend: bigint; forwarded: bigint; total: bigint }} Gas cost breakdown
 *
 * @example
 * ```typescript
 * const result = calculateCallCost(true, true, false, 100000n);
 * // { base, dynamic, stipend, forwarded, total }
 * ```
 */
export function calculateCallCost(isWarm, hasValue, isNewAccount, availableGas) {
	const base = isWarm ? WarmStorageRead : ColdAccountAccess;
	let dynamic = 0n;

	if (hasValue) {
		dynamic += CallValueTransfer;
		if (isNewAccount) {
			dynamic += CallNewAccount;
		}
	}

	const total = base + dynamic;
	const forwardedGas = availableGas - total;
	const forwarded = forwardedGas - forwardedGas / CallGasRetentionDivisor;
	const stipend = hasValue ? CallStipend : 0n;

	return { base, dynamic, stipend, forwarded, total };
}

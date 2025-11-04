import { Create, InitcodeWord, CreateData, MaxInitcodeSize } from "./constants.js";

/**
 * Calculate contract creation gas cost
 *
 * @param {bigint} initcodeSize - Size of initcode in bytes
 * @param {bigint} deployedSize - Size of deployed bytecode in bytes
 * @returns {{ base: bigint; dynamic: bigint; total: bigint }} Gas cost breakdown
 *
 * @example
 * ```typescript
 * const result = calculateCreateCost(1000n, 500n);
 * // { base: 32000n, initcode: ..., deployed: ..., total: ... }
 * ```
 */
export function calculateCreateCost(initcodeSize, deployedSize) {
	if (initcodeSize > MaxInitcodeSize) {
		throw new Error(
			`Initcode size ${initcodeSize} exceeds maximum ${MaxInitcodeSize}`,
		);
	}

	const initcodeWords = (initcodeSize + 31n) / 32n;
	const initcodeCost = initcodeWords * InitcodeWord;
	const deployedCost = deployedSize * CreateData;

	return {
		base: Create,
		dynamic: initcodeCost + deployedCost,
		total: Create + initcodeCost + deployedCost,
	};
}

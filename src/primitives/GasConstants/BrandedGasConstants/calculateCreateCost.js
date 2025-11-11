import {
	Create,
	CreateData,
	InitcodeWord,
	MaxInitcodeSize,
} from "./constants.js";
import { InvalidRangeError } from "../../errors/ValidationError.js";

/**
 * Calculate contract creation gas cost
 *
 * @param {bigint} initcodeSize - Size of initcode in bytes
 * @param {bigint} deployedSize - Size of deployed bytecode in bytes
 * @returns {{ base: bigint; dynamic: bigint; total: bigint }} Gas cost breakdown
 * @throws {InvalidRangeError} If initcode size exceeds maximum
 *
 * @example
 * ```typescript
 * const result = calculateCreateCost(1000n, 500n);
 * // { base: 32000n, initcode: ..., deployed: ..., total: ... }
 * ```
 */
export function calculateCreateCost(initcodeSize, deployedSize) {
	if (initcodeSize > MaxInitcodeSize) {
		throw new InvalidRangeError(
			`Initcode size ${initcodeSize} exceeds maximum ${MaxInitcodeSize}`,
			{
				value: initcodeSize,
				expected: `<= ${MaxInitcodeSize}`,
				code: "GAS_INITCODE_SIZE_EXCEEDED",
				docsPath:
					"/primitives/gas-constants/calculate-create-cost#error-handling",
			},
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

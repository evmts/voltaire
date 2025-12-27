import { InvalidFormatError } from "../errors/ValidationError.js";

/**
 * Create GasEstimate from number, bigint, or string
 *
 * @param {number | bigint | string} value - Gas estimate value
 * @returns {import('./GasEstimateType.js').GasEstimateType} Branded gas estimate
 * @throws {InvalidFormatError} If value is negative
 *
 * @example
 * ```typescript
 * const estimate = GasEstimate.from(51234n);
 * const fromRpc = GasEstimate.from(rpcEstimate);
 * ```
 */
export function from(value) {
	const bigintValue = typeof value === "bigint" ? value : BigInt(value);

	if (bigintValue < 0n) {
		throw new InvalidFormatError(
			`Gas estimate must be non-negative, got ${value}`,
			{
				value,
				expected: "Non-negative bigint",
				code: "GAS_ESTIMATE_INVALID_FORMAT",
				docsPath: "/primitives/gas-estimate/from#error-handling",
			},
		);
	}

	return /** @type {import('./GasEstimateType.js').GasEstimateType} */ (
		bigintValue
	);
}

import { InvalidRangeError } from "../errors/index.js";

/**
 * Validate gas limit is valid
 * @param this Transaction
 * @throws {InvalidRangeError} If gas limit is non-positive or exceeds maximum
 */
export function validateGasLimit(this: { gasLimit: bigint }): void {
	if (this.gasLimit <= 0n) {
		throw new InvalidRangeError("Gas limit must be positive", {
			code: "INVALID_GAS_LIMIT",
			value: this.gasLimit,
			expected: "Positive gas limit value",
			docsPath: "/primitives/transaction/validate-gas-limit#error-handling",
		});
	}
	// Check gas limit doesn't exceed reasonable maximum (30M gas)
	const MAX_GAS_LIMIT = 30_000_000n;
	if (this.gasLimit > MAX_GAS_LIMIT) {
		throw new InvalidRangeError(
			`Gas limit exceeds maximum of ${MAX_GAS_LIMIT}`,
			{
				code: "GAS_LIMIT_TOO_HIGH",
				value: this.gasLimit,
				expected: `Gas limit <= ${MAX_GAS_LIMIT}`,
				docsPath: "/primitives/transaction/validate-gas-limit#error-handling",
			},
		);
	}
}

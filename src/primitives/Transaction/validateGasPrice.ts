import { InvalidRangeError } from "../errors/index.js";
import type { EIP1559, EIP2930, EIP4844, EIP7702, Legacy } from "./types.js";

/**
 * Validate gas price is reasonable
 * @param this Transaction
 * @throws {InvalidRangeError} If gas price or fee values are invalid
 */
export function validateGasPrice(
	this: Legacy | EIP2930 | EIP1559 | EIP4844 | EIP7702,
): void {
	if ("gasPrice" in this) {
		if (this.gasPrice < 0n) {
			throw new InvalidRangeError("Gas price cannot be negative", {
				code: "INVALID_GAS_PRICE",
				value: this.gasPrice,
				expected: "Non-negative gas price",
				docsPath: "/primitives/transaction/validate-gas-price#error-handling",
			});
		}
	} else if ("maxFeePerGas" in this) {
		if (this.maxFeePerGas < 0n) {
			throw new InvalidRangeError("Max fee per gas cannot be negative", {
				code: "INVALID_MAX_FEE_PER_GAS",
				value: this.maxFeePerGas,
				expected: "Non-negative max fee per gas",
				docsPath: "/primitives/transaction/validate-gas-price#error-handling",
			});
		}
		if (this.maxPriorityFeePerGas < 0n) {
			throw new InvalidRangeError("Max priority fee per gas cannot be negative", {
				code: "INVALID_MAX_PRIORITY_FEE_PER_GAS",
				value: this.maxPriorityFeePerGas,
				expected: "Non-negative max priority fee per gas",
				docsPath: "/primitives/transaction/validate-gas-price#error-handling",
			});
		}
		if (this.maxPriorityFeePerGas > this.maxFeePerGas) {
			throw new InvalidRangeError(
				"Max priority fee per gas cannot exceed max fee per gas",
				{
					code: "MAX_PRIORITY_FEE_TOO_HIGH",
					value: this.maxPriorityFeePerGas,
					expected: `Max priority fee <= ${this.maxFeePerGas}`,
					context: {
						maxPriorityFeePerGas: this.maxPriorityFeePerGas,
						maxFeePerGas: this.maxFeePerGas,
					},
					docsPath: "/primitives/transaction/validate-gas-price#error-handling",
				},
			);
		}
	}
}

import type { EIP1559, EIP2930, EIP4844, EIP7702, Legacy } from "./types.js";

/**
 * Validate gas price is reasonable
 * @param this Transaction
 * @throws Error if gas price invalid
 */
export function validateGasPrice(
	this: Legacy | EIP2930 | EIP1559 | EIP4844 | EIP7702,
): void {
	if ("gasPrice" in this) {
		if (this.gasPrice < 0n) {
			throw new Error("Gas price cannot be negative");
		}
	} else if ("maxFeePerGas" in this) {
		if (this.maxFeePerGas < 0n) {
			throw new Error("Max fee per gas cannot be negative");
		}
		if (this.maxPriorityFeePerGas < 0n) {
			throw new Error("Max priority fee per gas cannot be negative");
		}
		if (this.maxPriorityFeePerGas > this.maxFeePerGas) {
			throw new Error("Max priority fee per gas cannot exceed max fee per gas");
		}
	}
}

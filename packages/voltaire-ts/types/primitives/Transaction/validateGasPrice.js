import { InvalidRangeError } from "../errors/index.js";
/**
 * Validate gas price is reasonable
 * @param this Transaction
 * @throws {InvalidRangeError} If gas price or fee values are invalid
 */
export function validateGasPrice() {
    if ("gasPrice" in this) {
        if (this.gasPrice < 0n) {
            throw new InvalidRangeError("Gas price cannot be negative", {
                code: -32602,
                value: this.gasPrice,
                expected: "Non-negative gas price",
                docsPath: "/primitives/transaction/validate-gas-price#error-handling",
            });
        }
    }
    else if ("maxFeePerGas" in this) {
        if (this.maxFeePerGas < 0n) {
            throw new InvalidRangeError("Max fee per gas cannot be negative", {
                code: -32602,
                value: this.maxFeePerGas,
                expected: "Non-negative max fee per gas",
                docsPath: "/primitives/transaction/validate-gas-price#error-handling",
            });
        }
        if (this.maxPriorityFeePerGas < 0n) {
            throw new InvalidRangeError("Max priority fee per gas cannot be negative", {
                code: -32602,
                value: this.maxPriorityFeePerGas,
                expected: "Non-negative max priority fee per gas",
                docsPath: "/primitives/transaction/validate-gas-price#error-handling",
            });
        }
        if (this.maxPriorityFeePerGas > this.maxFeePerGas) {
            throw new InvalidRangeError("Max priority fee per gas cannot exceed max fee per gas", {
                code: -32602,
                value: this.maxPriorityFeePerGas,
                expected: `Max priority fee <= ${this.maxFeePerGas}`,
                context: {
                    maxPriorityFeePerGas: this.maxPriorityFeePerGas,
                    maxFeePerGas: this.maxFeePerGas,
                },
                docsPath: "/primitives/transaction/validate-gas-price#error-handling",
            });
        }
    }
}

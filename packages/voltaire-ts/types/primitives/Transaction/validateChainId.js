import { InvalidRangeError } from "../errors/index.js";
/**
 * Validate chain ID is present
 * @param this Transaction
 * @throws {InvalidRangeError} If chainId is missing or invalid
 */
export function validateChainId() {
    if (this.chainId < 0n) {
        throw new InvalidRangeError("Chain ID cannot be negative", {
            code: -32602,
            value: this.chainId,
            expected: "Non-negative chain ID",
            docsPath: "/primitives/transaction/validate-chain-id#error-handling",
        });
    }
    if (this.chainId === 0n) {
        throw new InvalidRangeError("Chain ID must be specified for EIP transactions", {
            code: -32602,
            value: this.chainId,
            expected: "Non-zero chain ID for EIP transactions",
            docsPath: "/primitives/transaction/validate-chain-id#error-handling",
        });
    }
}

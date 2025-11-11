import { InvalidRangeError } from "../errors/index.js";
import type { EIP1559, EIP2930, EIP4844, EIP7702 } from "./types.js";

/**
 * Validate chain ID is present
 * @param this Transaction
 * @throws {InvalidRangeError} If chainId is missing or invalid
 */
export function validateChainId(
	this: EIP2930 | EIP1559 | EIP4844 | EIP7702,
): void {
	if (this.chainId < 0n) {
		throw new InvalidRangeError("Chain ID cannot be negative", {
			code: "INVALID_CHAIN_ID",
			value: this.chainId,
			expected: "Non-negative chain ID",
			docsPath: "/primitives/transaction/validate-chain-id#error-handling",
		});
	}
	if (this.chainId === 0n) {
		throw new InvalidRangeError(
			"Chain ID must be specified for EIP transactions",
			{
				code: "MISSING_CHAIN_ID",
				value: this.chainId,
				expected: "Non-zero chain ID for EIP transactions",
				docsPath: "/primitives/transaction/validate-chain-id#error-handling",
			},
		);
	}
}

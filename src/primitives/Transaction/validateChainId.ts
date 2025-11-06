import type { EIP2930, EIP1559, EIP4844, EIP7702 } from "./types.js";

/**
 * Validate chain ID is present
 * @param this Transaction
 * @throws Error if chainId missing or invalid
 */
export function validateChainId(
	this: EIP2930 | EIP1559 | EIP4844 | EIP7702,
): void {
	if (this.chainId < 0n) {
		throw new Error("Chain ID cannot be negative");
	}
	if (this.chainId === 0n) {
		throw new Error("Chain ID must be specified for EIP transactions");
	}
}

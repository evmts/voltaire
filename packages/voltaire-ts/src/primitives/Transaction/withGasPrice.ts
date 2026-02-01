import type {
	Any,
	EIP1559,
	EIP2930,
	EIP4844,
	EIP7702,
	Legacy,
} from "./types.js";

/**
 * Return new transaction with updated gas price
 * For EIP-1559+ transactions, updates maxFeePerGas
 * @param this Transaction
 * @param gasPrice New gas price value
 * @returns New transaction with updated gas price
 */
export function withGasPrice(this: Any, gasPrice: bigint): Any {
	if ("gasPrice" in this) {
		return { ...this, gasPrice } as Legacy | EIP2930;
	}
	// For EIP-1559+, update maxFeePerGas
	return { ...this, maxFeePerGas: gasPrice } as EIP1559 | EIP4844 | EIP7702;
}

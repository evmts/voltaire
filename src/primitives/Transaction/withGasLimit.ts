import type { Any } from "./types.js";

/**
 * Return new transaction with updated gas limit
 * @param this Transaction
 * @param gasLimit New gas limit value
 * @returns New transaction with updated gas limit
 */
export function withGasLimit(this: Any, gasLimit: bigint): Any {
	return { ...this, gasLimit };
}

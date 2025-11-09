import type {
	Any,
	EIP1559,
	EIP2930,
	EIP4844,
	EIP7702,
	Legacy,
} from "./types.js";

/**
 * Options for fee bump replacement
 */
export type ReplaceOptions = {
	/** Increase gas price by percentage (e.g., 10 for 10% increase) */
	bumpPercentage?: number;
	/** Explicit gas price to use (overrides bumpPercentage) */
	gasPrice?: bigint;
	/** Explicit maxFeePerGas (EIP-1559+) */
	maxFeePerGas?: bigint;
	/** Explicit maxPriorityFeePerGas (EIP-1559+) */
	maxPriorityFeePerGas?: bigint;
};

/**
 * Return new transaction with fee bump for replacement
 * @param this Transaction
 * @param options Replacement options
 * @returns New transaction with increased fees
 */
export function replaceWith(this: Any, options: ReplaceOptions = {}): Any {
	const bumpPercentage = options.bumpPercentage ?? 10;
	const multiplier = 1n + BigInt(bumpPercentage) / 100n;

	if ("gasPrice" in this) {
		const newGasPrice = options.gasPrice ?? this.gasPrice * multiplier;
		return { ...this, gasPrice: newGasPrice } as Legacy | EIP2930;
	}

	// EIP-1559+ transactions
	const newMaxFeePerGas =
		options.maxFeePerGas ?? this.maxFeePerGas * multiplier;
	const newMaxPriorityFeePerGas =
		options.maxPriorityFeePerGas ?? this.maxPriorityFeePerGas * multiplier;

	return {
		...this,
		maxFeePerGas: newMaxFeePerGas,
		maxPriorityFeePerGas: newMaxPriorityFeePerGas,
	} as EIP1559 | EIP4844 | EIP7702;
}

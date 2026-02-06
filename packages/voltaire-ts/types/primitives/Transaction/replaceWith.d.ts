import type { Any } from "./types.js";
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
export declare function replaceWith(this: Any, options?: ReplaceOptions): Any;
//# sourceMappingURL=replaceWith.d.ts.map
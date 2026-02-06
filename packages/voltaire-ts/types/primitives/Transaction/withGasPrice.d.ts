import type { Any } from "./types.js";
/**
 * Return new transaction with updated gas price
 * For EIP-1559+ transactions, updates maxFeePerGas
 * @param this Transaction
 * @param gasPrice New gas price value
 * @returns New transaction with updated gas price
 */
export declare function withGasPrice(this: Any, gasPrice: bigint): Any;
//# sourceMappingURL=withGasPrice.d.ts.map
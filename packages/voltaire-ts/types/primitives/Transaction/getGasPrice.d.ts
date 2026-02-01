import type { Any } from "./types.js";
/**
 * Get transaction gas price (handles different types).
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param baseFee - Optional base fee for EIP-1559 transactions
 * @returns Gas price
 * @throws {InvalidRangeError} If baseFee is missing for EIP-1559+ transactions
 * @throws {InvalidTransactionTypeError} If transaction type is unknown
 * @example
 * ```javascript
 * import { getGasPrice } from './primitives/Transaction/getGasPrice.js';
 * const gasPrice = getGasPrice.call(tx, 20n);
 * ```
 */
export declare function getGasPrice(this: Any, baseFee?: bigint): bigint;
//# sourceMappingURL=getGasPrice.d.ts.map
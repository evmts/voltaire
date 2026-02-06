/**
 * Return new transaction with updated gas limit
 * @param this Transaction
 * @param gasLimit New gas limit value
 * @returns New transaction with updated gas limit
 */
export function withGasLimit(gasLimit) {
    return { ...this, gasLimit };
}

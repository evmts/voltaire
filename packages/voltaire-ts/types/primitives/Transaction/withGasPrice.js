/**
 * Return new transaction with updated gas price
 * For EIP-1559+ transactions, updates maxFeePerGas
 * @param this Transaction
 * @param gasPrice New gas price value
 * @returns New transaction with updated gas price
 */
export function withGasPrice(gasPrice) {
    if ("gasPrice" in this) {
        return { ...this, gasPrice };
    }
    // For EIP-1559+, update maxFeePerGas
    return { ...this, maxFeePerGas: gasPrice };
}

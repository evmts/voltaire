/**
 * Return new transaction with fee bump for replacement
 * @param this Transaction
 * @param options Replacement options
 * @returns New transaction with increased fees
 */
export function replaceWith(options = {}) {
    const bumpPercentage = options.bumpPercentage ?? 10;
    if ("gasPrice" in this) {
        const newGasPrice = options.gasPrice ??
            (this.gasPrice * (100n + BigInt(bumpPercentage))) / 100n;
        return { ...this, gasPrice: newGasPrice };
    }
    // EIP-1559+ transactions
    const newMaxFeePerGas = options.maxFeePerGas ??
        (this.maxFeePerGas * (100n + BigInt(bumpPercentage))) / 100n;
    const newMaxPriorityFeePerGas = options.maxPriorityFeePerGas ??
        (this.maxPriorityFeePerGas * (100n + BigInt(bumpPercentage))) / 100n;
    return {
        ...this,
        maxFeePerGas: newMaxFeePerGas,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
    };
}

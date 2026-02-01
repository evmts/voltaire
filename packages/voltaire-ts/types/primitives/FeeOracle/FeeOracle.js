/**
 * FeeOracle Factory
 *
 * Creates FeeOracle instances for gas price estimation.
 *
 * @module primitives/FeeOracle
 */
/**
 * @typedef {import('./FeeOracleType.js').FeeOracleOptions} FeeOracleOptions
 * @typedef {import('./FeeOracleType.js').FeeOracle} FeeOracleInstance
 * @typedef {import('./FeeOracleType.js').FeeDataType} FeeDataType
 * @typedef {import('./FeeOracleType.js').FeeEstimateOptions} FeeEstimateOptions
 */
/** @type {Record<string, number>} */
const PRIORITY_MULTIPLIERS = {
    low: 0.8,
    medium: 1.0,
    high: 1.5,
};
/**
 * Create a FeeOracle instance
 *
 * @param {FeeOracleOptions} options
 * @returns {FeeOracleInstance}
 *
 * @example
 * ```typescript
 * const oracle = FeeOracle({ provider });
 *
 * // Get current fees
 * const feeData = await oracle.getFeeData();
 * console.log(`Base fee: ${feeData.baseFeePerGas}`);
 *
 * // Estimate EIP-1559 fees
 * const fees = await oracle.estimateEip1559Fees({ priority: 'high' });
 *
 * // Watch for fee updates
 * oracle.watchFees((data) => console.log(data));
 * ```
 */
export function FeeOracle(options) {
    const { provider, priorityFeePercentile = 50, historyBlocks = 4 } = options;
    /**
     * Get current fee data
     * @returns {Promise<FeeDataType>}
     */
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex logic required
    async function getFeeData() {
        // Fetch in parallel
        const [gasPriceHex, latestBlock, feeHistory] = await Promise.all([
            provider.request({ method: "eth_gasPrice" }),
            provider.request({
                method: "eth_getBlockByNumber",
                params: ["latest", false],
            }),
            provider
                .request({
                method: "eth_feeHistory",
                params: [historyBlocks, "latest", [priorityFeePercentile]],
            })
                .catch(() => null), // Not all chains support feeHistory
        ]);
        const gasPrice = BigInt(/** @type {string} */ (gasPriceHex));
        const block = /** @type {any} */ (latestBlock);
        const blockNumber = BigInt(block.number);
        const baseFeePerGas = block.baseFeePerGas
            ? BigInt(block.baseFeePerGas)
            : null;
        const blobBaseFee = block.blobGasPrice ? BigInt(block.blobGasPrice) : null;
        // Calculate suggested priority fee from history
        let maxPriorityFeePerGas = null;
        let maxFeePerGas = null;
        if (feeHistory && baseFeePerGas !== null) {
            const history = /** @type {any} */ (feeHistory);
            const rewards = history.reward || [];
            // Average the priority fees from history
            let totalPriorityFee = 0n;
            let count = 0;
            for (const blockRewards of rewards) {
                if (blockRewards?.[0]) {
                    totalPriorityFee += BigInt(blockRewards[0]);
                    count++;
                }
            }
            if (count > 0) {
                maxPriorityFeePerGas = totalPriorityFee / BigInt(count);
                // maxFeePerGas = baseFee * 2 + priorityFee (standard buffer)
                maxFeePerGas = baseFeePerGas * 2n + maxPriorityFeePerGas;
            }
        }
        return /** @type {FeeDataType} */ ({
            gasPrice,
            baseFeePerGas,
            maxFeePerGas,
            maxPriorityFeePerGas,
            blobBaseFee,
            blockNumber,
        });
    }
    /**
     * Estimate EIP-1559 fees
     * @param {FeeEstimateOptions} [opts]
     * @returns {Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }>}
     */
    async function estimateEip1559Fees(opts = {}) {
        const { priority = "medium", baseFeeMultiplier = 1.25 } = opts;
        const feeData = await getFeeData();
        if (feeData.baseFeePerGas === null) {
            // Fallback for non-EIP-1559 chains
            const multiplier = PRIORITY_MULTIPLIERS[priority] || 1.0;
            const adjusted = (feeData.gasPrice * BigInt(Math.floor(multiplier * 100))) / 100n;
            return {
                maxFeePerGas: adjusted,
                maxPriorityFeePerGas: adjusted,
            };
        }
        const priorityMultiplier = PRIORITY_MULTIPLIERS[priority] || 1.0;
        // Calculate priority fee
        const basePriorityFee = feeData.maxPriorityFeePerGas || 1000000000n; // 1 gwei default
        const maxPriorityFeePerGas = (basePriorityFee * BigInt(Math.floor(priorityMultiplier * 100))) / 100n;
        // Calculate max fee with buffer for base fee increases
        const bufferedBaseFee = (feeData.baseFeePerGas * BigInt(Math.floor(baseFeeMultiplier * 100))) /
            100n;
        const maxFeePerGas = bufferedBaseFee + maxPriorityFeePerGas;
        return { maxFeePerGas, maxPriorityFeePerGas };
    }
    /**
     * Watch for fee updates
     * @param {(feeData: FeeDataType) => void} callback
     * @param {{ pollingInterval?: number; signal?: AbortSignal }} [opts]
     * @returns {() => void}
     */
    function watchFees(callback, opts = {}) {
        const { pollingInterval = 12000, signal } = opts;
        let stopped = false;
        let timeoutId = /** @type {ReturnType<typeof setTimeout> | null} */ (null);
        async function poll() {
            if (stopped || signal?.aborted)
                return;
            try {
                const feeData = await getFeeData();
                callback(feeData);
            }
            catch {
                // Continue polling on errors
            }
            if (!stopped && !signal?.aborted) {
                timeoutId = setTimeout(poll, pollingInterval);
            }
        }
        // Start polling
        poll();
        // Handle abort signal
        signal?.addEventListener("abort", () => {
            stopped = true;
            if (timeoutId)
                clearTimeout(timeoutId);
        });
        // Return unsubscribe function
        return () => {
            stopped = true;
            if (timeoutId)
                clearTimeout(timeoutId);
        };
    }
    return {
        getFeeData,
        estimateEip1559Fees,
        watchFees,
    };
}

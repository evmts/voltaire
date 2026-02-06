import type { brand } from "../../brand.js";

/**
 * Fee data returned by FeeOracle
 *
 * Contains current gas price information for transaction fee estimation.
 * Supports both legacy (gasPrice) and EIP-1559 (maxFeePerGas, maxPriorityFeePerGas) fee models.
 */
export type FeeDataType = {
	/** Current gas price (legacy transactions) */
	readonly gasPrice: bigint;
	/** Current base fee per gas (EIP-1559) */
	readonly baseFeePerGas: bigint | null;
	/** Suggested max fee per gas (EIP-1559) */
	readonly maxFeePerGas: bigint | null;
	/** Suggested max priority fee per gas (EIP-1559) */
	readonly maxPriorityFeePerGas: bigint | null;
	/** Current blob base fee (EIP-4844, null if not supported) */
	readonly blobBaseFee: bigint | null;
	/** Block number this data was fetched from */
	readonly blockNumber: bigint;
} & { readonly [brand]: "FeeData" };

/**
 * Fee estimation options
 */
export interface FeeEstimateOptions {
	/** Priority level for fee estimation */
	priority?: "low" | "medium" | "high";
	/** Multiplier for base fee (default: 1.25 for 25% buffer) */
	baseFeeMultiplier?: number;
}

/**
 * FeeOracle instance - provides gas price estimation
 */
export interface FeeOracle {
	/**
	 * Get current fee data from the network
	 *
	 * @returns Current fee data including gas prices and base fees
	 *
	 * @example
	 * ```typescript
	 * const feeData = await oracle.getFeeData();
	 * console.log(`Gas price: ${feeData.gasPrice}`);
	 * console.log(`Base fee: ${feeData.baseFeePerGas}`);
	 * ```
	 */
	getFeeData(): Promise<FeeDataType>;

	/**
	 * Estimate fees for an EIP-1559 transaction
	 *
	 * @param options - Fee estimation options
	 * @returns Suggested maxFeePerGas and maxPriorityFeePerGas
	 *
	 * @example
	 * ```typescript
	 * const fees = await oracle.estimateEip1559Fees({ priority: 'high' });
	 * const tx = {
	 *   maxFeePerGas: fees.maxFeePerGas,
	 *   maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
	 *   // ...
	 * };
	 * ```
	 */
	estimateEip1559Fees(options?: FeeEstimateOptions): Promise<{
		maxFeePerGas: bigint;
		maxPriorityFeePerGas: bigint;
	}>;

	/**
	 * Watch for fee updates
	 *
	 * @param callback - Called when fees change
	 * @param options - Watch options
	 * @returns Unsubscribe function
	 *
	 * @example
	 * ```typescript
	 * const unsubscribe = oracle.watchFees(
	 *   (feeData) => console.log(`New base fee: ${feeData.baseFeePerGas}`),
	 *   { pollingInterval: 12000 }
	 * );
	 * // Later: unsubscribe();
	 * ```
	 */
	watchFees(
		callback: (feeData: FeeDataType) => void,
		options?: { pollingInterval?: number; signal?: AbortSignal },
	): () => void;
}

/**
 * Options for creating a FeeOracle
 */
export interface FeeOracleOptions {
	/** EIP-1193 provider */
	provider: {
		request(args: { method: string; params?: unknown[] }): Promise<unknown>;
	};
	/** Default priority fee percentile (default: 50) */
	priorityFeePercentile?: number;
	/** History blocks to analyze for priority fee (default: 4) */
	historyBlocks?: number;
}

/**
 * FeeOracle factory function type
 */
export type FeeOracleFactory = (options: FeeOracleOptions) => FeeOracle;

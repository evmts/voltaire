/**
 * Calculated transaction fee breakdown
 */
export type TxFee = {
	/** Effective gas price paid (wei per gas) */
	effectiveGasPrice: bigint;
	/** Priority fee paid (wei per gas) */
	priorityFee: bigint;
	/** Base fee paid (wei per gas) */
	baseFee: bigint;
};

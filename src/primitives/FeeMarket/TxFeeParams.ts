/**
 * Transaction fee parameters
 */
export type TxFeeParams = {
	/** Maximum fee per gas willing to pay (wei) */
	maxFeePerGas: bigint;
	/** Maximum priority fee per gas (tip to miner, wei) */
	maxPriorityFeePerGas: bigint;
	/** Current block base fee (wei) */
	baseFee: bigint;
};

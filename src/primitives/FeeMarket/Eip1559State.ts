/**
 * EIP-1559 specific state
 */
export type Eip1559State = {
	/** Gas used in block */
	gasUsed: bigint;
	/** Gas limit of block */
	gasLimit: bigint;
	/** Base fee per gas (wei) */
	baseFee: bigint;
};

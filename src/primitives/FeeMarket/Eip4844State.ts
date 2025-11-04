/**
 * EIP-4844 specific state
 */
export type Eip4844State = {
	/** Excess blob gas accumulated */
	excessBlobGas: bigint;
	/** Blob gas used in block */
	blobGasUsed: bigint;
};

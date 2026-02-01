import type { TxFeeParams } from "./TxFeeParams.js";

/**
 * Blob transaction fee parameters (EIP-4844)
 */
export type BlobTxFeeParams = TxFeeParams & {
	/** Maximum fee per blob gas (wei) */
	maxFeePerBlobGas: bigint;
	/** Current blob base fee (wei) */
	blobBaseFee: bigint;
	/** Number of blobs in transaction */
	blobCount: bigint;
};

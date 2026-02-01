import type { TxFee } from "./TxFee.js";

/**
 * Calculated blob transaction fee breakdown
 */
export type BlobTxFee = TxFee & {
	/** Blob gas price paid (wei per blob gas) */
	blobGasPrice: bigint;
	/** Total blob fee (wei) */
	totalBlobFee: bigint;
};

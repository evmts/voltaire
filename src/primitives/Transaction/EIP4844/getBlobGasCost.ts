import type { BrandedTransactionEIP4844 } from "./BrandedTransactionEIP4844.js";

/**
 * Calculate total blob gas cost
 */
export function getBlobGasCost(
	tx: BrandedTransactionEIP4844,
	blobBaseFee: bigint,
): bigint {
	// Each blob is 128 KB = 131072 bytes, gas per blob is fixed
	const gasPerBlob = 131072n;
	const blobCount = BigInt(tx.blobVersionedHashes.length);
	return blobCount * gasPerBlob * blobBaseFee;
}

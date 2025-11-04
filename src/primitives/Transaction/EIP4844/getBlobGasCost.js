/**
 * Calculate total blob gas cost
 *
 * @param {import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844} tx - EIP-4844 transaction
 * @param {bigint} blobBaseFee - Blob base fee per gas
 * @returns {bigint} Total blob gas cost
 *
 * @example
 * ```typescript
 * const cost = getBlobGasCost(tx, 1000000n);
 * ```
 */
export function getBlobGasCost(tx, blobBaseFee) {
	// Each blob is 128 KB = 131072 bytes, gas per blob is fixed
	const gasPerBlob = 131072n;
	const blobCount = BigInt(tx.blobVersionedHashes.length);
	return blobCount * gasPerBlob * blobBaseFee;
}

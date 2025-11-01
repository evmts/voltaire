import type { EIP4844 } from "../types.js";

/**
 * Calculate total blob gas cost
 */
export function getBlobGasCost(
	this: EIP4844,
	blobBaseFee: bigint,
): bigint {
	// Each blob is 128 KB = 131072 bytes, gas per blob is fixed
	const gasPerBlob = 131072n;
	const blobCount = BigInt(this.blobVersionedHashes.length);
	return blobCount * gasPerBlob * blobBaseFee;
}

import type { BrandedBlob, Commitment } from "./BrandedBlob.js";
import { SIZE } from "./constants.js";

/**
 * Compute KZG commitment for blob
 *
 * @param blob - Blob data
 * @returns 48-byte KZG commitment
 *
 * @example
 * ```typescript
 * const commitment = Blob.toCommitment(blob);
 * ```
 *
 * TODO: Implement using c-kzg-4844 library
 * - Load KZG trusted setup
 * - Call blobToKzgCommitment(blob)
 * - Return 48-byte commitment
 */
export function toCommitment(blob: BrandedBlob): Commitment {
	if (blob.length !== SIZE) {
		throw new Error(`Invalid blob size: ${blob.length}`);
	}
	// TODO: const commitment = blobToKzgCommitment(blob);
	// TODO: return commitment as Commitment;
	throw new Error("Not implemented: requires c-kzg-4844 library");
}

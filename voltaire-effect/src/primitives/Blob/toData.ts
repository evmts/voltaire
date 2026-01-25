import { BrandedBlob as BlobNamespace } from "@tevm/voltaire";

type BrandedBlob = BlobNamespace.BrandedBlob;

/**
 * Extracts the original data from a blob.
 * Decodes blob format back to raw data bytes.
 * Pure function - never throws.
 *
 * @param blob - The blob to extract data from
 * @returns The original data as Uint8Array
 *
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 *
 * const originalData = Blob.toData(blob)
 * ```
 *
 * @since 0.0.1
 */
export const toData = (blob: BrandedBlob): Uint8Array =>
	BlobNamespace.toData(blob);

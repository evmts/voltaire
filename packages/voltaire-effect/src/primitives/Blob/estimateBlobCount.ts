/**
 * @module estimateBlobCount
 * @description Estimate number of blobs needed for data
 * @since 0.1.0
 */
import { BrandedBlob as BlobNamespace } from "@tevm/voltaire";
import { Effect } from "effect";
import type { InvalidBlobDataSizeError } from "@tevm/voltaire/Blob";

/**
 * Estimate number of blobs needed for data.
 *
 * @param dataSize - Size of data in bytes
 * @returns Effect yielding blob count or failing with InvalidBlobDataSizeError
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import * as Effect from 'effect/Effect'
 *
 * const count = await Effect.runPromise(Blob.estimateBlobCount(200000)) // 2
 * ```
 * @since 0.1.0
 */
export const estimateBlobCount = (
	dataSize: number,
): Effect.Effect<number, InvalidBlobDataSizeError> =>
	Effect.try({
		try: () => BlobNamespace.estimateBlobCount(dataSize),
		catch: (e) => e as InvalidBlobDataSizeError,
	});

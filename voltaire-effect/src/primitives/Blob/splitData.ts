/**
 * @module splitData
 * @description Split large data into multiple blobs
 * @since 0.1.0
 */
import { BrandedBlob as BlobNamespace } from "@tevm/voltaire";
import { Effect } from "effect";
import type { InvalidBlobDataSizeError } from "@tevm/voltaire/Blob";

type BrandedBlob = BlobNamespace.BrandedBlob;

/**
 * Split large data into multiple blobs.
 *
 * Each blob holds up to 126972 bytes of data (max 6 blobs per transaction).
 *
 * @param data - Data to split
 * @returns Effect yielding array of blobs or failing with InvalidBlobDataSizeError
 * @throws {InvalidBlobDataSizeError} If data requires more than 6 blobs
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import * as Effect from 'effect/Effect'
 *
 * const largeData = new Uint8Array(300000)
 * const blobs = await Effect.runPromise(Blob.splitData(largeData)) // [blob1, blob2, blob3]
 * ```
 * @since 0.1.0
 */
export const splitData = (
	data: Uint8Array,
): Effect.Effect<BrandedBlob[], InvalidBlobDataSizeError> =>
	Effect.try({
		try: () => BlobNamespace.splitData(data),
		catch: (e) => e as InvalidBlobDataSizeError,
	});

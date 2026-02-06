/**
 * @module joinData
 * @description Join multiple blobs into single data buffer
 * @since 0.1.0
 */
import { BrandedBlob as BlobNamespace } from "@tevm/voltaire";
import { Effect } from "effect";
import type {
	InvalidBlobSizeError,
	InvalidBlobLengthPrefixError,
} from "@tevm/voltaire/Blob";

type BrandedBlob = BlobNamespace.BrandedBlob;

/**
 * Join multiple blobs into single data buffer.
 *
 * Extracts and concatenates data from each blob.
 *
 * @param blobs - Array of blobs to join
 * @returns Effect yielding combined data or failing with error
 * @throws {InvalidBlobSizeError} If blob size is not 131072 bytes
 * @throws {InvalidBlobLengthPrefixError} If length prefix is invalid
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import * as Effect from 'effect/Effect'
 *
 * const blobs = await Effect.runPromise(Blob.splitData(largeData))
 * const reconstructed = await Effect.runPromise(Blob.joinData(blobs))
 * ```
 * @since 0.1.0
 */
export const joinData = (
	blobs: readonly BrandedBlob[],
): Effect.Effect<
	Uint8Array,
	InvalidBlobSizeError | InvalidBlobLengthPrefixError
> =>
	Effect.try({
		try: () => BlobNamespace.joinData(blobs),
		catch: (e) => e as InvalidBlobSizeError | InvalidBlobLengthPrefixError,
	});

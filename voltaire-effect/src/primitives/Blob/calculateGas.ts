/**
 * @module calculateGas
 * @description Calculate blob gas for number of blobs
 * @since 0.1.0
 */
import { BrandedBlob as BlobNamespace } from "@tevm/voltaire";
import { Effect } from "effect";
import type { InvalidBlobCountError } from "@tevm/voltaire/Blob";

/**
 * Calculate blob gas for number of blobs.
 *
 * @param blobCount - Number of blobs (0-6)
 * @returns Effect yielding total blob gas or failing with InvalidBlobCountError
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import * as Effect from 'effect/Effect'
 *
 * const gas = await Effect.runPromise(Blob.calculateGas(3)) // 393216
 * ```
 * @since 0.1.0
 */
export const calculateGas = (
	blobCount: number,
): Effect.Effect<number, InvalidBlobCountError> =>
	Effect.try({
		try: () => BlobNamespace.calculateGas(blobCount),
		catch: (e) => e as InvalidBlobCountError,
	});

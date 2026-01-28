/**
 * @module from
 * @description Create Blob from Uint8Array with Effect error handling
 * @since 0.1.0
 */
import { BrandedBlob as BlobNamespace } from "@tevm/voltaire";
import { Effect } from "effect";
import type { InvalidBlobDataSizeError } from "@tevm/voltaire/Blob";

type BrandedBlob = BlobNamespace.BrandedBlob;

/**
 * Create Blob from Uint8Array (either raw blob data or data to encode)
 *
 * If input is 131072 bytes, returns as-is. Otherwise encodes with padding.
 *
 * @param value - Uint8Array (either 131072 bytes blob or data to encode)
 * @returns Effect yielding BrandedBlob or failing with InvalidBlobDataSizeError
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import * as Effect from 'effect/Effect'
 *
 * // Raw 128KB blob
 * const blob1 = await Effect.runPromise(Blob.from(new Uint8Array(131072)))
 *
 * // Auto-encode smaller data
 * const blob2 = await Effect.runPromise(Blob.from(new TextEncoder().encode("Hello")))
 * ```
 * @since 0.1.0
 */
export const from = (
	value: Uint8Array,
): Effect.Effect<BrandedBlob, InvalidBlobDataSizeError> =>
	Effect.try({
		try: () => BlobNamespace.from(value),
		catch: (e) => e as InvalidBlobDataSizeError,
	});

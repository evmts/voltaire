/**
 * @module fromData
 * @description Create Blob from arbitrary data with EIP-4844 field element encoding
 * @since 0.1.0
 */
import { BrandedBlob as BlobNamespace } from "@tevm/voltaire";
import { Effect } from "effect";
import type { InvalidBlobDataSizeError } from "@tevm/voltaire/Blob";

type BrandedBlob = BlobNamespace.BrandedBlob;

/**
 * Create Blob from arbitrary data (will be padded to 128KB)
 *
 * Uses EIP-4844 field element encoding where each 32-byte field element
 * has byte[0] = 0x00 for BLS field constraint. First 4 bytes store length.
 *
 * @param data - Data to encode (max 126972 bytes)
 * @returns Effect yielding BrandedBlob or failing with InvalidBlobDataSizeError
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import * as Effect from 'effect/Effect'
 *
 * const data = new TextEncoder().encode("Hello, blob!")
 * const blob = await Effect.runPromise(Blob.fromData(data))
 * ```
 * @since 0.1.0
 */
export const fromData = (
	data: Uint8Array,
): Effect.Effect<BrandedBlob, InvalidBlobDataSizeError> =>
	Effect.try({
		try: () => BlobNamespace.fromData(data),
		catch: (e) => e as InvalidBlobDataSizeError,
	});

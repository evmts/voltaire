/**
 * @module toCommitment
 * @description Compute KZG commitment for blob using KZGService
 * @since 0.1.0
 */
import type { BrandedBlob as BlobNamespace } from "@tevm/voltaire";
import { Effect } from "effect";
import {
	type KZGError,
	KZGService,
} from "../../crypto/KZG/KZGService.js";

type BrandedBlob = BlobNamespace.BrandedBlob;
type Commitment = BlobNamespace.Commitment;

/**
 * Compute KZG commitment for blob.
 *
 * Requires KZGService to be provided in the Effect context.
 *
 * @param blob - 128KB blob data
 * @returns Effect yielding 48-byte commitment, requiring KZGService
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import { KZGLive } from 'voltaire-effect/crypto/KZG'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Blob.toCommitment(blob).pipe(Effect.provide(KZGLive))
 * const commitment = await Effect.runPromise(program)
 * ```
 * @since 0.1.0
 */
export const toCommitment = (
	blob: BrandedBlob,
): Effect.Effect<Commitment, KZGError, KZGService> =>
	Effect.gen(function* () {
		const kzg = yield* KZGService;
		const commitment = yield* kzg.blobToKzgCommitment(
			blob as unknown as import("@tevm/voltaire").KzgBlobType,
		);
		return commitment as unknown as Commitment;
	});

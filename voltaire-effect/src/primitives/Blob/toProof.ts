/**
 * @module toProof
 * @description Generate KZG proof for blob using KZGService
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
type Proof = BlobNamespace.Proof;

/**
 * Generate KZG proof for blob and commitment.
 *
 * Requires KZGService to be provided in the Effect context.
 *
 * @param blob - 128KB blob data
 * @param commitment - 48-byte KZG commitment
 * @returns Effect yielding 48-byte proof, requiring KZGService
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import { KZGLive } from 'voltaire-effect/crypto/KZG'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const commitment = yield* Blob.toCommitment(blob)
 *   const proof = yield* Blob.toProof(blob, commitment)
 *   return proof
 * }).pipe(Effect.provide(KZGLive))
 * ```
 * @since 0.1.0
 */
export const toProof = (
	blob: BrandedBlob,
	commitment: Commitment,
): Effect.Effect<Proof, KZGError, KZGService> =>
	Effect.gen(function* () {
		const kzg = yield* KZGService;
		const proof = yield* kzg.computeBlobKzgProof(
			blob as unknown as import("@tevm/voltaire").KzgBlobType,
			commitment as unknown as import("@tevm/voltaire").KzgCommitmentType,
		);
		return proof as unknown as Proof;
	});

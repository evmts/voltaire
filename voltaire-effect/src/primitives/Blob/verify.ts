/**
 * @module verify
 * @description Verify KZG proof for blob using KZGService
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
 * Verify KZG proof for blob and commitment.
 *
 * Requires KZGService to be provided in the Effect context.
 *
 * @param blob - 128KB blob data
 * @param commitment - 48-byte KZG commitment
 * @param proof - 48-byte KZG proof
 * @returns Effect yielding boolean (true if valid), requiring KZGService
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import { KZGLive } from 'voltaire-effect/crypto/KZG'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Blob.verify(blob, commitment, proof).pipe(Effect.provide(KZGLive))
 * const isValid = await Effect.runPromise(program)
 * ```
 * @since 0.1.0
 */
export const verify = (
	blob: BrandedBlob,
	commitment: Commitment,
	proof: Proof,
): Effect.Effect<boolean, KZGError, KZGService> =>
	Effect.gen(function* () {
		const kzg = yield* KZGService;
		return yield* kzg.verifyBlobKzgProof(
			blob as unknown as import("@tevm/voltaire").KzgBlobType,
			commitment as unknown as import("@tevm/voltaire").KzgCommitmentType,
			proof as unknown as import("@tevm/voltaire").KzgProofType,
		);
	});

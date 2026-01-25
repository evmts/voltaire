/**
 * @fileoverview KZG commitment operations for Effect.
 * @module KZG/commit
 * @since 0.0.1
 */
import type { KzgBlobType, KzgCommitmentType } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { type KZGError, KZGService } from "./KZGService.js";

/**
 * Computes a KZG commitment for a blob.
 *
 * @description
 * Creates a 48-byte G1 point commitment from blob data. The commitment
 * uniquely identifies the blob and can be verified with a proof.
 * Used in EIP-4844 for blob transaction data availability.
 *
 * @param blob - The 128KB blob data (4096 field elements × 32 bytes)
 * @returns Effect containing the 48-byte commitment or KZGError, requiring KZGService
 *
 * @example
 * ```typescript
 * import { blobToKzgCommitment, KZGLive } from 'voltaire-effect/crypto/KZG'
 * import * as Effect from 'effect/Effect'
 *
 * const program = blobToKzgCommitment(blob).pipe(Effect.provide(KZGLive))
 * // Returns: KzgCommitmentType (48 bytes)
 * ```
 *
 * @see {@link computeBlobKzgProof} to generate proof
 * @see {@link https://eips.ethereum.org/EIPS/eip-4844 | EIP-4844}
 * @since 0.0.1
 */
export const blobToKzgCommitment = (
	blob: KzgBlobType,
): Effect.Effect<KzgCommitmentType, KZGError, KZGService> =>
	Effect.gen(function* () {
		const kzg = yield* KZGService;
		return yield* kzg.blobToKzgCommitment(blob);
	});

/**
 * Computes a KZG proof for a blob and commitment.
 *
 * @description
 * Generates a 48-byte proof that the commitment correctly represents the blob.
 * The proof can be verified by any party to confirm data availability without
 * downloading the full blob.
 *
 * @param blob - The 128KB blob data (4096 field elements × 32 bytes)
 * @param commitment - The 48-byte commitment from blobToKzgCommitment
 * @returns Effect containing the 48-byte proof or KZGError, requiring KZGService
 *
 * @example
 * ```typescript
 * import { computeBlobKzgProof, blobToKzgCommitment, KZGLive } from 'voltaire-effect/crypto/KZG'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const commitment = yield* blobToKzgCommitment(blob)
 *   return yield* computeBlobKzgProof(blob, commitment)
 * }).pipe(Effect.provide(KZGLive))
 * ```
 *
 * @see {@link blobToKzgCommitment} to generate commitment
 * @see {@link verifyBlobKzgProof} to verify the proof
 * @since 0.0.1
 */
export const computeBlobKzgProof = (
	blob: KzgBlobType,
	commitment: KzgCommitmentType,
): Effect.Effect<import("@tevm/voltaire").KzgProofType, KZGError, KZGService> =>
	Effect.gen(function* () {
		const kzg = yield* KZGService;
		return yield* kzg.computeBlobKzgProof(blob, commitment);
	});

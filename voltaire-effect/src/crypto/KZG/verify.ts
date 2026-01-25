/**
 * @fileoverview KZG proof verification for Effect.
 * @module KZG/verify
 * @since 0.0.1
 */
import type { KzgBlobType, KzgCommitmentType, KzgProofType } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import { KZGService } from './KZGService.js'

/**
 * Verifies a KZG proof against a blob and commitment.
 *
 * @description
 * Cryptographically verifies that the proof demonstrates the commitment
 * correctly represents the blob. Used by validators and light clients
 * to confirm blob data availability in EIP-4844 transactions.
 *
 * @param blob - The 128KB blob data (4096 field elements × 32 bytes)
 * @param commitment - The 48-byte commitment
 * @param proof - The 48-byte proof from computeBlobKzgProof
 * @returns Effect containing true if proof is valid, requiring KZGService
 *
 * @example
 * ```typescript
 * import { verifyBlobKzgProof, blobToKzgCommitment, computeBlobKzgProof, KZGLive } from 'voltaire-effect/crypto/KZG'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const commitment = yield* blobToKzgCommitment(blob)
 *   const proof = yield* computeBlobKzgProof(blob, commitment)
 *   return yield* verifyBlobKzgProof(blob, commitment, proof)
 * }).pipe(Effect.provide(KZGLive))
 * // Returns: true
 * ```
 *
 * @throws Never fails
 * @see {@link blobToKzgCommitment} to generate commitment
 * @see {@link computeBlobKzgProof} to generate proof
 * @since 0.0.1
 */
export const verifyBlobKzgProof = (
  blob: KzgBlobType,
  commitment: KzgCommitmentType,
  proof: KzgProofType
): Effect.Effect<boolean, never, KZGService> =>
  Effect.gen(function* () {
    const kzg = yield* KZGService
    return yield* kzg.verifyBlobKzgProof(blob, commitment, proof)
  })

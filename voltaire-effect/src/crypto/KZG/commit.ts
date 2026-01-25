import type { KzgBlobType, KzgCommitmentType } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import { KZGService } from './KZGService.js'

/**
 * Computes a KZG commitment for a blob.
 * Used in EIP-4844 for blob transaction data availability.
 *
 * @param blob - The 128KB blob data
 * @returns Effect containing the 48-byte commitment, requiring KZGService
 * @example
 * ```typescript
 * import { blobToKzgCommitment, KZGLive } from 'voltaire-effect/crypto/KZG'
 * import * as Effect from 'effect/Effect'
 *
 * const program = blobToKzgCommitment(blob).pipe(Effect.provide(KZGLive))
 * ```
 * @since 0.0.1
 */
export const blobToKzgCommitment = (blob: KzgBlobType): Effect.Effect<KzgCommitmentType, never, KZGService> =>
  Effect.gen(function* () {
    const kzg = yield* KZGService
    return yield* kzg.blobToKzgCommitment(blob)
  })

/**
 * Computes a KZG proof for a blob and commitment.
 * The proof can be verified to confirm the commitment matches the blob.
 *
 * @param blob - The 128KB blob data
 * @param commitment - The 48-byte commitment
 * @returns Effect containing the 48-byte proof, requiring KZGService
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
 * @since 0.0.1
 */
export const computeBlobKzgProof = (blob: KzgBlobType, commitment: KzgCommitmentType): Effect.Effect<import('@tevm/voltaire').KzgProofType, never, KZGService> =>
  Effect.gen(function* () {
    const kzg = yield* KZGService
    return yield* kzg.computeBlobKzgProof(blob, commitment)
  })

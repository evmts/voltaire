import type { KzgBlobType, KzgCommitmentType, KzgProofType } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import { KZGService } from './KZGService.js'

/**
 * Verifies a KZG proof against a blob and commitment.
 * Used to confirm blob data availability in EIP-4844.
 *
 * @param blob - The 128KB blob data
 * @param commitment - The 48-byte commitment
 * @param proof - The 48-byte proof
 * @returns Effect containing true if proof is valid, requiring KZGService
 * @example
 * ```typescript
 * import { verifyBlobKzgProof, KZGLive } from 'voltaire-effect/crypto/KZG'
 * import * as Effect from 'effect/Effect'
 *
 * const program = verifyBlobKzgProof(blob, commitment, proof).pipe(
 *   Effect.provide(KZGLive)
 * )
 * ```
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

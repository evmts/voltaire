/**
 * @fileoverview KZG polynomial commitment module for Effect.
 * Implements EIP-4844 blob commitments for Ethereum proto-danksharding.
 *
 * @module KZG
 * @since 0.0.1
 *
 * @description
 * KZG (Kate-Zaverucha-Goldberg) polynomial commitments enable efficient verification
 * of blob data in Ethereum's EIP-4844 (proto-danksharding). This module wraps the
 * trusted setup and commitment/proof operations in Effect for safe, composable usage.
 *
 * Key concepts:
 * - Blob: 128KB of data (4096 field elements)
 * - Commitment: 48-byte G1 point representing the blob
 * - Proof: 48-byte proof that commitment matches blob
 *
 * @example
 * ```typescript
 * import { KZGService, KZGLive, blobToKzgCommitment, computeBlobKzgProof, verifyBlobKzgProof } from 'voltaire-effect/crypto/KZG'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const commitment = yield* blobToKzgCommitment(blob)
 *   const proof = yield* computeBlobKzgProof(blob, commitment)
 *   const isValid = yield* verifyBlobKzgProof(blob, commitment, proof)
 *   return isValid
 * }).pipe(Effect.provide(KZGLive))
 * ```
 *
 * @see {@link https://eips.ethereum.org/EIPS/eip-4844 | EIP-4844}
 */

export { blobToKzgCommitment, computeBlobKzgProof } from "./commit.js";
export {
	KZGLive,
	KZGService,
	type KZGServiceShape,
	KZGTest,
} from "./KZGService.js";
export { verifyBlobKzgProof } from "./verify.js";

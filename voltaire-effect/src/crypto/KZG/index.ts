/**
 * KZG polynomial commitment module for Effect.
 * Implements EIP-4844 blob commitments for proto-danksharding.
 * @module
 * @since 0.0.1
 */
export { KZGService, KZGLive, KZGTest, type KZGServiceShape } from './KZGService.js'
export { blobToKzgCommitment, computeBlobKzgProof } from './commit.js'
export { verifyBlobKzgProof } from './verify.js'

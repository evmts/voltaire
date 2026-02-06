/**
 * Factory: Convert blob to KZG commitment
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array) => Uint8Array} deps.blobToKzgCommitment - c-kzg blobToKzgCommitment function
 * @returns {(blob: Uint8Array) => Uint8Array} Function that converts blob to KZG commitment
 *
 * @example
 * ```typescript
 * import { BlobToKzgCommitment } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const blobToKzgCommitment = BlobToKzgCommitment({ blobToKzgCommitment: ckzg.blobToKzgCommitment })
 * const commitment = blobToKzgCommitment(blob)
 * ```
 */
export function BlobToKzgCommitment({ blobToKzgCommitment: ckzgBlobToKzgCommitment, }: {
    blobToKzgCommitment: (blob: Uint8Array) => Uint8Array;
}): (blob: Uint8Array) => Uint8Array;
//# sourceMappingURL=blobToKzgCommitment.d.ts.map
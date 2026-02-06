/**
 * Factory: Compute KZG commitment for blob
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array) => Uint8Array} deps.blobToKzgCommitment - KZG commitment function from c-kzg-4844
 * @returns {(blob: import('./BlobType.js').BrandedBlob) => import('./BlobType.js').Commitment} Function that computes KZG commitment
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @throws {InvalidLengthError} If blob size is invalid
 * @throws {PrimitiveError} If c-kzg-4844 library is not available
 * @example
 * ```javascript
 * import { ToCommitment } from './primitives/Blob/index.js';
 * import { blobToKzgCommitment } from 'c-kzg';
 *
 * const toCommitment = ToCommitment({ blobToKzgCommitment });
 * const commitment = toCommitment(blob);
 * ```
 */
export function ToCommitment({ blobToKzgCommitment }: {
    blobToKzgCommitment: (blob: Uint8Array) => Uint8Array;
}): (blob: import("./BlobType.js").BrandedBlob) => import("./BlobType.js").Commitment;
//# sourceMappingURL=toCommitment.d.ts.map
import { InvalidLengthError, PrimitiveError } from "../errors/index.js";
import { SIZE } from "./constants.js";
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
export function ToCommitment({ blobToKzgCommitment }) {
    return function toCommitment(blob) {
        if (blob.length !== SIZE) {
            throw new InvalidLengthError(`Invalid blob size: ${blob.length}`, {
                value: blob.length,
                expected: `${SIZE} bytes`,
                code: -32602,
                docsPath: "/primitives/blob/to-commitment#error-handling",
            });
        }
        try {
            const commitment = blobToKzgCommitment(blob);
            return /** @type {import('./BlobType.js').Commitment} */ (commitment);
        }
        catch (error) {
            throw new PrimitiveError(`Failed to compute KZG commitment: ${error instanceof Error ? error.message : String(error)}`, {
                code: -32000,
                docsPath: "/primitives/blob/to-commitment#error-handling",
                cause: error instanceof Error ? error : undefined,
            });
        }
    };
}

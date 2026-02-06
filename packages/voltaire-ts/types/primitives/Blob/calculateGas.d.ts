/**
 * Calculate blob gas for number of blobs
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {number} blobCount - Number of blobs
 * @returns {number} Total blob gas
 * @throws {InvalidBlobCountError} If blob count is negative or exceeds maximum per transaction
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const gas = Blob.calculateGas(3); // 393216
 * ```
 */
export function calculateGas(blobCount: number): number;
//# sourceMappingURL=calculateGas.d.ts.map
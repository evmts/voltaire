/**
 * Join multiple blobs into single data buffer
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {readonly import('../BrandedBlob.js').BrandedBlob[]} blobs - Array of blobs to join
 * @returns {Uint8Array} Combined data
 * @throws {InvalidBlobSizeError} If blob size is not 131072 bytes
 * @throws {InvalidBlobLengthPrefixError} If length prefix exceeds maximum
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const blobs = Blob.splitData(largeData);
 * const reconstructed = Blob.joinData(blobs);
 * ```
 */
export function joinData(blobs: readonly import("../BrandedBlob.js").BrandedBlob[]): Uint8Array;
//# sourceMappingURL=joinData.d.ts.map
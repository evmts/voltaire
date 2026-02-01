/**
 * Split large data into multiple blobs
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {Uint8Array} data - Data to split
 * @returns {import('./BlobType.js').BrandedBlob[]} Array of blobs containing the data
 * @throws {InvalidBlobDataSizeError} If data requires more blobs than maximum per transaction
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const largeData = new Uint8Array(300000);
 * const blobs = Blob.splitData(largeData); // [blob1, blob2, blob3]
 * ```
 */
export function splitData(data: Uint8Array): import("./BlobType.js").BrandedBlob[];
//# sourceMappingURL=splitData.d.ts.map
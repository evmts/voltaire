import { BYTES_PER_FIELD_ELEMENT, FIELD_ELEMENTS_PER_BLOB, } from "./constants.js";
import { InvalidBlobDataSizeError } from "./errors.js";
/**
 * Estimate number of blobs needed for data
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {number} dataSize - Size of data in bytes
 * @returns {number} Number of blobs required
 * @throws {InvalidBlobDataSizeError} If data size is negative
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const blobCount = Blob.estimateBlobCount(200000); // 2
 * ```
 */
export function estimateBlobCount(dataSize) {
    if (dataSize < 0) {
        throw new InvalidBlobDataSizeError(`Invalid data size: ${dataSize}`, {
            value: dataSize,
            expected: "non-negative number",
        });
    }
    if (dataSize === 0) {
        return 0;
    }
    // Each field element reserves 1 byte for BLS field constraint (must be 0x00)
    // Plus 4 bytes for length prefix in first field element
    const maxDataPerBlob = FIELD_ELEMENTS_PER_BLOB * (BYTES_PER_FIELD_ELEMENT - 1) - 4;
    return Math.ceil(dataSize / maxDataPerBlob);
}

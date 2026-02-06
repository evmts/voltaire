import { BYTES_PER_FIELD_ELEMENT, FIELD_ELEMENTS_PER_BLOB, SIZE, } from "./constants.js";
import { InvalidBlobLengthPrefixError, InvalidBlobSizeError, } from "./errors.js";
/**
 * Extract data from blob using EIP-4844 field element decoding.
 * Format: Each 32-byte field element has byte[0] = 0x00 (BLS field constraint)
 * The first 4 bytes of data space (field 0, bytes 1-4) contain the length prefix.
 * Data bytes follow in bytes 5-31 of field 0, then bytes 1-31 of subsequent fields.
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @see https://eips.ethereum.org/EIPS/eip-4844 for EIP-4844 specification
 * @since 0.0.0
 * @param {import('./BlobType.js').BrandedBlob} blob - Blob data
 * @returns {Uint8Array} Original data
 * @throws {InvalidBlobSizeError} If blob size is not 131072 bytes
 * @throws {InvalidBlobLengthPrefixError} If length prefix exceeds maximum
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const data = Blob.toData(blob);
 * const text = new TextDecoder().decode(data);
 * ```
 */
export function toData(blob) {
    if (blob.length !== SIZE) {
        throw new InvalidBlobSizeError(`Invalid blob size: ${blob.length} (expected ${SIZE})`, {
            value: blob.length,
            expected: `${SIZE} bytes`,
        });
    }
    // Read 4-byte big-endian length prefix from positions 1-4
    const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
    const dataLength = view.getUint32(1, false); // big-endian
    // Max data bytes: 31 bytes per field element - 4 bytes for length prefix
    const maxDataSize = FIELD_ELEMENTS_PER_BLOB * (BYTES_PER_FIELD_ELEMENT - 1) - 4;
    if (dataLength > maxDataSize) {
        throw new InvalidBlobLengthPrefixError(`Invalid length prefix: ${dataLength} (max ${maxDataSize})`, {
            value: dataLength,
            expected: `max ${maxDataSize}`,
        });
    }
    // Extract data
    const data = new Uint8Array(dataLength);
    let dataOffset = 0;
    let blobOffset = 5; // Start after length prefix (0 + 1-4)
    while (dataOffset < dataLength) {
        const fieldIndex = Math.floor(blobOffset / BYTES_PER_FIELD_ELEMENT);
        const fieldStart = fieldIndex * BYTES_PER_FIELD_ELEMENT;
        const posInField = blobOffset - fieldStart;
        // Skip position 0 of each field element (always 0x00)
        if (posInField === 0) {
            blobOffset = fieldStart + 1;
            continue;
        }
        // Copy data byte (index is always in bounds by construction)
        data[dataOffset] = /** @type {number} */ (blob[blobOffset]);
        dataOffset++;
        blobOffset++;
    }
    return data;
}

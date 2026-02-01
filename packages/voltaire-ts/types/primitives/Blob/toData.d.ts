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
export function toData(blob: import("./BlobType.js").BrandedBlob): Uint8Array;
//# sourceMappingURL=toData.d.ts.map
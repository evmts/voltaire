/**
 * Create blob from arbitrary data using EIP-4844 field element encoding.
 * Format: Each 32-byte field element has byte[0] = 0x00 (BLS field constraint)
 * The first 4 bytes of data space (field 0, bytes 1-4) store the length prefix.
 * Remaining data bytes fill bytes 5-31 of field 0, then bytes 1-31 of subsequent fields.
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @see https://eips.ethereum.org/EIPS/eip-4844 for EIP-4844 specification
 * @since 0.0.0
 * @param {Uint8Array} data - Data to encode (max 126972 bytes)
 * @returns {import('./BlobType.js').BrandedBlob} Blob containing encoded data
 * @throws {InvalidBlobDataSizeError} If data exceeds maximum size
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const data = new TextEncoder().encode("Hello, blob!");
 * const blob = Blob.fromData(data);
 * ```
 */
export function fromData(data: Uint8Array): import("./BlobType.js").BrandedBlob;
//# sourceMappingURL=fromData.d.ts.map
/**
 * Normalize a hex string or byte array to exactly `size` bytes.
 *
 * @param {unknown} value
 * @param {number} size
 * @param {string} field - Field name for the error message
 * @returns {Uint8Array}
 * @throws {InvalidExecutionPayloadBidError} If the value is not `size` bytes
 */
export function toFixedBytes(value: unknown, size: number, field: string): Uint8Array;
//# sourceMappingURL=toFixedBytes.d.ts.map
/**
 * Convert number to Bytes
 *
 * @param {number} value - Number to convert (must be safe integer, non-negative)
 * @param {number} [size] - Optional byte size (pads or throws if too small)
 * @returns {import('./BytesType.js').BytesType} Bytes
 * @throws {NegativeNumberError} If value is negative
 * @throws {UnsafeIntegerError} If value exceeds MAX_SAFE_INTEGER
 * @throws {NonIntegerError} If value is not an integer
 * @throws {SizeExceededError} If number requires more bytes than size allows
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.fromNumber(255);     // Uint8Array([0xff])
 * Bytes.fromNumber(255, 2);  // Uint8Array([0x00, 0xff])
 * Bytes.fromNumber(0x1234);  // Uint8Array([0x12, 0x34])
 * ```
 */
export function fromNumber(value: number, size?: number): import("./BytesType.js").BytesType;
//# sourceMappingURL=fromNumber.d.ts.map
/**
 * Convert bigint to Bytes
 *
 * @param {bigint} value - BigInt to convert (must be non-negative)
 * @param {number} [size] - Optional byte size (pads or throws if too small)
 * @returns {import('./BytesType.js').BytesType} Bytes
 * @throws {NegativeBigIntError} If value is negative
 * @throws {SizeExceededError} If value doesn't fit in size
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.fromBigInt(255n);      // Uint8Array([0xff])
 * Bytes.fromBigInt(255n, 2);   // Uint8Array([0x00, 0xff])
 * Bytes.fromBigInt(0x1234n);   // Uint8Array([0x12, 0x34])
 * ```
 */
export function fromBigInt(value: bigint, size?: number): import("./BytesType.js").BytesType;
//# sourceMappingURL=fromBigInt.d.ts.map
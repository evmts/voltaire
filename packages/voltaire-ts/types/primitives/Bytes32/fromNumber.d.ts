/**
 * Create Bytes32 from number (big-endian, zero-padded)
 *
 * @param {number} value - Number to convert
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32
 *
 * @example
 * ```typescript
 * const b32 = Bytes32.fromNumber(42);
 * // Last byte is 42, rest are zeros
 * ```
 */
export function fromNumber(value: number): import("./Bytes32Type.js").Bytes32Type;
//# sourceMappingURL=fromNumber.d.ts.map
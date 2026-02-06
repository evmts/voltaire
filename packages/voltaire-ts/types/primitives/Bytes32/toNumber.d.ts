/**
 * Convert Bytes32 to number (big-endian)
 *
 * @param {import('./Bytes32Type.js').Bytes32Type} bytes32 - Bytes32 to convert
 * @returns {number} Number representation
 * @throws {InvalidBytes32ValueError} If value exceeds Number.MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * const value = Bytes32.toNumber(b32);
 * ```
 */
export function toNumber(bytes32: import("./Bytes32Type.js").Bytes32Type): number;
//# sourceMappingURL=toNumber.d.ts.map
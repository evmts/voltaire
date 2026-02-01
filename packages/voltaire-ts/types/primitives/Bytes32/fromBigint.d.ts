/**
 * Create Bytes32 from bigint (big-endian)
 *
 * @param {bigint} value - Bigint to convert (must fit in 256 bits)
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32
 * @throws {InvalidBytes32ValueError} If value is negative or exceeds 256 bits
 *
 * @example
 * ```typescript
 * const b32 = Bytes32.fromBigint(0x123456789abcdef0n);
 * ```
 */
export function fromBigint(value: bigint): import("./Bytes32Type.js").Bytes32Type;
//# sourceMappingURL=fromBigint.d.ts.map
/**
 * Create Bytes32 from various input types (universal constructor)
 *
 * @param {number | bigint | string | Uint8Array} value - Number, bigint, hex string, or Uint8Array
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32
 * @throws {InvalidBytes32ValueError} If value type is unsupported or invalid
 *
 * @example
 * ```typescript
 * const b1 = Bytes32.from(42);                    // from number
 * const b2 = Bytes32.from(42n);                   // from bigint
 * const b3 = Bytes32.from('0x' + 'ab'.repeat(32)); // from hex
 * const b4 = Bytes32.from(new Uint8Array(32));    // from bytes
 * ```
 */
export function from(value: number | bigint | string | Uint8Array): import("./Bytes32Type.js").Bytes32Type;
//# sourceMappingURL=from.d.ts.map
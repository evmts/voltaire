/**
 * Create Bytes from various input types (universal constructor)
 *
 * @param {Uint8Array | string | number[]} value - Uint8Array, hex string, UTF-8 string, or number array
 * @returns {import('./BytesType.js').BytesType} Bytes
 * @throws {InvalidValueError} If value type is unsupported or invalid
 *
 * @example
 * ```typescript
 * const b1 = Bytes.from(new Uint8Array([0x01, 0x02]));
 * const b2 = Bytes.from("0x1234");
 * const b3 = Bytes.from("hello");
 * const b4 = Bytes.from([0x01, 0x02, 0x03]);
 * ```
 */
export function from(value: Uint8Array | string | number[]): import("./BytesType.js").BytesType;
//# sourceMappingURL=from.d.ts.map
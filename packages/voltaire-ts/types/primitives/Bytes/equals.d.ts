/**
 * Check if two Bytes are equal
 *
 * WARNING: This function is NOT constant-time. It returns early on the first
 * byte mismatch, which can leak timing information. Do NOT use for comparing:
 * - Cryptographic hashes
 * - MACs or signatures
 * - Passwords or secret tokens
 *
 * For security-sensitive comparisons, use `equalsConstantTime()` instead.
 *
 * @param {import('./BytesType.js').BytesType} a - First Bytes
 * @param {import('./BytesType.js').BytesType} b - Second Bytes
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const equal = Bytes.equals(bytes1, bytes2);
 * ```
 */
export function equals(a: import("./BytesType.js").BytesType, b: import("./BytesType.js").BytesType): boolean;
//# sourceMappingURL=equals.d.ts.map
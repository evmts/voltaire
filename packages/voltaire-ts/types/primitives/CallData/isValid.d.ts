/**
 * Check if value can be converted to CallData
 *
 * @param {unknown} value - Value to validate
 * @returns {boolean} True if value can be converted to CallData
 *
 * @example
 * ```javascript
 * CallData.isValid("0xa9059cbb"); // true (valid 4-byte selector)
 * CallData.isValid("0x1234"); // false (only 2 bytes)
 * CallData.isValid("0xGGGG"); // false (invalid hex)
 * CallData.isValid(null); // false
 * ```
 */
export function isValid(value: unknown): boolean;
//# sourceMappingURL=isValid.d.ts.map
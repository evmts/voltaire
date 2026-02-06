/**
 * Check if value is a valid address (accepts string, Uint8Array, or Address instance)
 *
 * @param {string | Uint8Array} value - Value to validate
 * @returns {boolean} True if valid address format
 *
 * @example
 * ```typescript
 * // Validate hex string
 * Address.isValid("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"); // true
 *
 * // Validate Uint8Array (including Address instances)
 * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * Address.isValid(addr); // true
 *
 * // Invalid cases
 * Address.isValid("0xinvalid"); // false
 * Address.isValid(new Uint8Array(10)); // false (wrong length)
 * ```
 */
export function isValid(value: string | Uint8Array): boolean;
//# sourceMappingURL=isValid.d.ts.map
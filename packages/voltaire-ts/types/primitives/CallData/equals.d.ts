/**
 * Check if two CallData instances are equal (constant-time comparison)
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param {import('./CallDataType.js').CallDataType} a - First CallData
 * @param {import('./CallDataType.js').CallDataType} b - Second CallData
 * @returns {boolean} True if instances are bytewise identical
 *
 * @example
 * ```javascript
 * const calldata1 = CallData.from("0xa9059cbb...");
 * const calldata2 = CallData.from("0xa9059cbb...");
 * console.log(CallData.equals(calldata1, calldata2)); // true
 * ```
 */
export function equals(a: import("./CallDataType.js").CallDataType, b: import("./CallDataType.js").CallDataType): boolean;
//# sourceMappingURL=equals.d.ts.map
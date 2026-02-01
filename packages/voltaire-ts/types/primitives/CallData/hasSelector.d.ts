/**
 * Check if CallData matches a specific function selector
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param {import('./CallDataType.js').CallDataType} calldata - CallData to check
 * @param {string | Uint8Array} selector - Expected selector (hex string or bytes)
 * @returns {boolean} True if selector matches
 *
 * @example
 * ```javascript
 * const calldata = CallData.from("0xa9059cbb...");
 *
 * // Check with hex string
 * CallData.hasSelector(calldata, "0xa9059cbb"); // true
 *
 * // Check with bytes
 * CallData.hasSelector(calldata, new Uint8Array([0xa9, 0x05, 0x9c, 0xbb])); // true
 * ```
 */
export function hasSelector(calldata: import("./CallDataType.js").CallDataType, selector: string | Uint8Array): boolean;
//# sourceMappingURL=hasSelector.d.ts.map
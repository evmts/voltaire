/**
 * Encode function call into CallData
 *
 * @param {string} signature - Function signature (e.g., "transfer(address,uint256)")
 * @param {unknown[]} params - Array of parameter values
 * @returns {import('./CallDataType.js').CallDataType} Encoded calldata
 * @throws {InvalidSignatureError} If function signature format is invalid
 * @throws {ParameterCountMismatchError} If parameter count doesn't match signature
 *
 * @example
 * ```javascript
 * const calldata = CallData.encode(
 *   "transfer(address,uint256)",
 *   ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "1000000000000000000"]
 * );
 * ```
 */
export function encode(signature: string, params: unknown[]): import("./CallDataType.js").CallDataType;
//# sourceMappingURL=encode.d.ts.map
/**
 * Unwrap result or return default value on failure
 *
 * @param {import('./ContractResultType.js').ContractResultType} result - Contract result
 * @param {import('../ReturnData/ReturnDataType.js').ReturnDataType} defaultValue - Default value
 * @returns {import('../ReturnData/ReturnDataType.js').ReturnDataType} Return data or default
 *
 * @example
 * ```typescript
 * const data = ContractResult.unwrapOr(result, ReturnData.fromHex("0x"));
 * ```
 */
export function unwrapOr(result, defaultValue) {
    return result.success ? result.data : defaultValue;
}

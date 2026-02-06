/**
 * Decode error parameters from encoded data
 *
 * @template {string} TName
 * @template {readonly import('../parameter/index.js').BrandedParameter[]} TInputs
 * @param {import('./ErrorType.js').ErrorType<TName, TInputs>} error - ABI error definition
 * @param {Uint8Array} data - Encoded error data with selector prefix
 * @returns {import('../Parameter.js').ParametersToPrimitiveTypes<TInputs>} Decoded parameter values
 * @throws {AbiDecodingError} If data is too short for selector
 * @throws {AbiInvalidSelectorError} If selector doesn't match expected
 *
 * @example
 * ```typescript
 * const error = { type: "error", name: "InsufficientBalance", inputs: [{ type: "uint256", name: "balance" }] };
 * const decoded = decodeParams(error, encodedData); // [100n]
 * ```
 */
export function decodeParams<TName extends string, TInputs extends readonly import("../parameter/index.js").BrandedParameter[]>(error: import("./ErrorType.js").ErrorType<TName, TInputs>, data: Uint8Array): import("../Parameter.js").ParametersToPrimitiveTypes<TInputs>;
//# sourceMappingURL=decodeParams.d.ts.map
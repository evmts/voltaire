/**
 * Encode error parameters with selector prefix
 *
 * @template {string} TName
 * @template {readonly import('../parameter/index.js').BrandedParameter[]} TInputs
 * @param {import('./ErrorType.js').ErrorType<TName, TInputs>} error - ABI error definition
 * @param {import('../Parameter.js').ParametersToPrimitiveTypes<TInputs>} args - Parameter values to encode
 * @returns {Uint8Array} Encoded error data with 4-byte selector prefix
 *
 * @example
 * ```typescript
 * const error = { type: "error", name: "InsufficientBalance", inputs: [{ type: "uint256", name: "balance" }] };
 * const encoded = encodeParams(error, [100n]); // Uint8Array with selector + encoded params
 * ```
 */
export function encodeParams<TName extends string, TInputs extends readonly import("../parameter/index.js").BrandedParameter[]>(error: import("./ErrorType.js").ErrorType<TName, TInputs>, args: import("../Parameter.js").ParametersToPrimitiveTypes<TInputs>): Uint8Array;
//# sourceMappingURL=encodeParams.d.ts.map
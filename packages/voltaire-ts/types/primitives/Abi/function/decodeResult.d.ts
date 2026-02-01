/**
 * Decode function return values
 *
 * @template {string} TName
 * @template {import('./statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @template {readonly import('../Parameter.js').Parameter[]} TOutputs
 * @param {import('./FunctionType.js').FunctionType<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
 * @param {Uint8Array} data - Encoded return data
 * @returns {import('../Parameter.js').ParametersToPrimitiveTypes<TOutputs>} Decoded return values
 *
 * @example
 * ```typescript
 * const func = {
 *   type: "function",
 *   name: "balanceOf",
 *   stateMutability: "view",
 *   inputs: [{ type: "address", name: "account" }],
 *   outputs: [{ type: "uint256", name: "" }]
 * };
 * const decoded = decodeResult(func, encoded);
 * // [1000n]
 * ```
 */
export function decodeResult<TName extends string, TStateMutability extends import("./statemutability.js").StateMutability, TInputs extends readonly import("../Parameter.js").Parameter[], TOutputs extends readonly import("../Parameter.js").Parameter[]>(fn: import("./FunctionType.js").FunctionType<TName, TStateMutability, TInputs, TOutputs>, data: Uint8Array): import("../Parameter.js").ParametersToPrimitiveTypes<TOutputs>;
//# sourceMappingURL=decodeResult.d.ts.map
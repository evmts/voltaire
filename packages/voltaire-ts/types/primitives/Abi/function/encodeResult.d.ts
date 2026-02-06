/**
 * Encode function return values
 *
 * @template {string} TName
 * @template {import('./statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @template {readonly import('../Parameter.js').Parameter[]} TOutputs
 * @param {import('./FunctionType.js').FunctionType<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
 * @param {import('../Parameter.js').ParametersToPrimitiveTypes<TOutputs>} values - Return values
 * @returns {Uint8Array} Encoded return data
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
 * const encoded = encodeResult(func, [1000n]);
 * ```
 */
export function encodeResult<TName extends string, TStateMutability extends import("./statemutability.js").StateMutability, TInputs extends readonly import("../Parameter.js").Parameter[], TOutputs extends readonly import("../Parameter.js").Parameter[]>(fn: import("./FunctionType.js").FunctionType<TName, TStateMutability, TInputs, TOutputs>, values: import("../Parameter.js").ParametersToPrimitiveTypes<TOutputs>): Uint8Array;
//# sourceMappingURL=encodeResult.d.ts.map
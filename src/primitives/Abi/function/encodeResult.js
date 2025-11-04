import { encodeParameters } from "../Encoding.js";

/**
 * Encode function return values
 *
 * @template {string} TName
 * @template {import('./statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @template {readonly import('../Parameter.js').Parameter[]} TOutputs
 * @param {import('./BrandedFunction.js').Function<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
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
export function encodeResult(fn, values) {
	return encodeParameters(fn.outputs, values);
}

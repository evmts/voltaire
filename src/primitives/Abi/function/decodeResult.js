import { decodeParameters } from "../Encoding.js";

/**
 * Decode function return values
 *
 * @template {string} TName
 * @template {import('./statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @template {readonly import('../Parameter.js').Parameter[]} TOutputs
 * @param {import('./BrandedFunction.js').Function<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
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
export function decodeResult(fn, data) {
	return /** @type {any} */ (decodeParameters(fn.outputs, data));
}

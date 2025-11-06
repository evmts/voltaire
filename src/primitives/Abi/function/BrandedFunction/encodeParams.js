import { encodeParameters } from "../../Encoding.js";
import { getSelector } from "./getSelector.js";

/**
 * Encode function call data (selector + ABI-encoded parameters)
 *
 * @template {string} TName
 * @template {import('./statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @template {readonly import('../Parameter.js').Parameter[]} TOutputs
 * @param {import('./BrandedFunction.js').Function<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
 * @param {import('../Parameter.js').ParametersToPrimitiveTypes<TInputs>} args - Function arguments
 * @returns {Uint8Array} Encoded calldata (selector + params)
 *
 * @example
 * ```typescript
 * const func = {
 *   type: "function",
 *   name: "transfer",
 *   stateMutability: "nonpayable",
 *   inputs: [
 *     { type: "address", name: "to" },
 *     { type: "uint256", name: "amount" }
 *   ],
 *   outputs: []
 * };
 * const encoded = encodeParams(func, [
 *   "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
 *   100n
 * ]);
 * ```
 */
export function encodeParams(fn, args) {
	const selector = getSelector(fn);
	const encoded = encodeParameters(fn.inputs, args);
	const result = new Uint8Array(selector.length + encoded.length);
	result.set(selector, 0);
	result.set(encoded, selector.length);
	return result;
}

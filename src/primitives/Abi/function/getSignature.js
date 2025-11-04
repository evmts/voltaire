/**
 * Get function signature string (name(type1,type2,...))
 *
 * @template {string} TName
 * @template {import('./statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @template {readonly import('../Parameter.js').Parameter[]} TOutputs
 * @param {import('./BrandedFunction.js').Function<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
 * @returns {string} Function signature string
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
 * const sig = getSignature(func);
 * // "transfer(address,uint256)"
 * ```
 */
export function getSignature(fn) {
	const inputs = fn.inputs.map((p) => p.type).join(",");
	return `${fn.name}(${inputs})`;
}

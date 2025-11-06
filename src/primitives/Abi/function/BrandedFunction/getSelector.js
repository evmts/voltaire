import { keccak256String } from "../../../Hash/BrandedHash/keccak256String.js";
import { getSignature } from "./getSignature.js";

/**
 * Get function selector (first 4 bytes of keccak256 hash of signature)
 *
 * @template {string} TName
 * @template {import('./statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @template {readonly import('../Parameter.js').Parameter[]} TOutputs
 * @param {import('./BrandedFunction.js').Function<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
 * @returns {Uint8Array} 4-byte function selector
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
 * const selector = getSelector(func);
 * // Uint8Array([0xa9, 0x05, 0x9c, 0xbb]) - transfer(address,uint256)
 * ```
 */
export function getSelector(fn) {
	const signature = getSignature(fn);
	const hash = keccak256String(signature);
	return hash.slice(0, 4);
}

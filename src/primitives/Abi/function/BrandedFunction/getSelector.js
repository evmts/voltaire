import { getSignature } from "./getSignature.js";

/**
 * Factory: Get function selector (first 4 bytes of keccak256 hash of signature)
 * @param {Object} deps - Crypto dependencies
 * @param {(str: string) => Uint8Array} deps.keccak256String - Keccak256 hash function for strings
 * @returns {(fn: any) => Uint8Array} Function that computes function selector
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @example
 * ```javascript
 * import { GetSelector } from './primitives/Abi/function/index.js';
 * import { keccak256String } from './primitives/Hash/index.js';
 *
 * const getSelector = GetSelector({ keccak256String });
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
export function GetSelector({ keccak256String }) {
	/**
	 * Get function selector (first 4 bytes of keccak256 hash of signature)
	 *
	 * @template {string} TName
	 * @template {import('./statemutability.js').StateMutability} TStateMutability
	 * @template {readonly import('../../Parameter.js').Parameter[]} TInputs
	 * @template {readonly import('../../Parameter.js').Parameter[]} TOutputs
	 * @param {import('./BrandedFunction.js').Function<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
	 * @returns {Uint8Array} 4-byte function selector
	 * @throws {never}
	 */
	return function getSelector(fn) {
		const signature = getSignature(fn);
		const hash = keccak256String(signature);
		return hash.slice(0, 4);
	};
}

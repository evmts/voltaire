/**
 * Decode function call data (verify selector and decode parameters)
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @template {string} TName
 * @template {import('./statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @template {readonly import('../Parameter.js').Parameter[]} TOutputs
 * @param {import('./FunctionType.js').FunctionType<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
 * @param {Uint8Array} data - Encoded calldata
 * @returns {import('../Parameter.js').ParametersToPrimitiveTypes<TInputs>} Decoded arguments
 * @throws {FunctionDecodingError} If data is too short
 * @throws {FunctionInvalidSelectorError} If selector doesn't match
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
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
 * const decoded = Abi.Function.decodeParams(func, encoded);
 * // ["0x742d35cc6634c0532925a3b844bc9e7595f251e3", 100n]
 * ```
 */
export function decodeParams<TName extends string, TStateMutability extends import("./statemutability.js").StateMutability, TInputs extends readonly import("../Parameter.js").Parameter[], TOutputs extends readonly import("../Parameter.js").Parameter[]>(fn: import("./FunctionType.js").FunctionType<TName, TStateMutability, TInputs, TOutputs>, data: Uint8Array): import("../Parameter.js").ParametersToPrimitiveTypes<TInputs>;
//# sourceMappingURL=decodeParams.d.ts.map
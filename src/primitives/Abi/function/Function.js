import * as FunctionNs from "./index.js";

/**
 * @typedef {import('./FunctionType.js').FunctionType} FunctionType
 */

/**
 * Factory function for creating/validating Function ABI items
 * Since Function items are plain objects, this mainly serves as a namespace
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @template {string} TName
 * @template {import('./statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../parameter/index.js').ParameterType[]} TInputs
 * @template {readonly import('../parameter/index.js').ParameterType[]} TOutputs
 * @param {import('./FunctionType.js').FunctionType<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
 * @returns {import('./FunctionType.js').FunctionType<TName, TStateMutability, TInputs, TOutputs>} Validated function item
 * @throws {never}
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const func = Abi.Function({
 *   type: 'function',
 *   name: 'transfer',
 *   stateMutability: 'nonpayable',
 *   inputs: [{ type: 'address' }, { type: 'uint256' }],
 *   outputs: [{ type: 'bool' }]
 * });
 * ```
 */
export function Function(fn) {
	return fn;
}

// Static methods delegate to function namespace
Function.getSelector = FunctionNs.getSelector;
Function.getSignature = FunctionNs.getSignature;
Function.encodeParams = FunctionNs.encodeParams;
Function.decodeParams = FunctionNs.decodeParams;
Function.encodeResult = FunctionNs.encodeResult;
Function.decodeResult = FunctionNs.decodeResult;

// Constructor-style aliases (data-first pattern)
Function.Signature = FunctionNs.Signature;
Function.Params = FunctionNs.Params;
Function.DecodeParams = FunctionNs.DecodeParams;
Function.Result = FunctionNs.Result;
Function.DecodeResult = FunctionNs.DecodeResult;

// Factories
Function.GetSelector = FunctionNs.GetSelector;

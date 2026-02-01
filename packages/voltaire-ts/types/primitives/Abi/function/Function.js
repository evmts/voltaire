/**
 * @typedef {import('./FunctionType.js').FunctionType} FunctionType
 */
import { keccak256String as keccak256StringImpl } from "../../Hash/index.js";
import { decodeParams } from "./decodeParams.js";
import { decodeResult } from "./decodeResult.js";
import { encodeParams } from "./encodeParams.js";
import { encodeResult } from "./encodeResult.js";
import { GetSelector } from "./getSelector.js";
import { getSignature } from "./getSignature.js";
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
function FunctionFactory(fn) {
    return fn;
}
// Create getSelector with crypto dependency
const getSelector = GetSelector({
    keccak256String: keccak256StringImpl,
});
// Attach static methods
FunctionFactory.getSignature = getSignature;
FunctionFactory.getSelector = getSelector;
FunctionFactory.encodeParams = encodeParams;
FunctionFactory.decodeParams = decodeParams;
FunctionFactory.encodeResult = encodeResult;
FunctionFactory.decodeResult = decodeResult;
// Constructor-style aliases (data-first pattern)
FunctionFactory.Signature = getSignature;
FunctionFactory.Params = encodeParams;
FunctionFactory.DecodeParams = decodeParams;
FunctionFactory.Result = encodeResult;
FunctionFactory.DecodeResult = decodeResult;
// Factory method
FunctionFactory.GetSelector = GetSelector;
export { FunctionFactory as Function };

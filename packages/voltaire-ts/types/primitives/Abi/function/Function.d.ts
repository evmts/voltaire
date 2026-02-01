export { FunctionFactory as Function };
export type FunctionType = import("./FunctionType.js").FunctionType;
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
declare function FunctionFactory<TName extends string, TStateMutability extends import("./statemutability.js").StateMutability, TInputs extends readonly import("../parameter/index.js").ParameterType[], TOutputs extends readonly import("../parameter/index.js").ParameterType[]>(fn: import("./FunctionType.js").FunctionType<TName, TStateMutability, TInputs, TOutputs>): import("./FunctionType.js").FunctionType<TName, TStateMutability, TInputs, TOutputs>;
declare namespace FunctionFactory {
    export { getSignature };
    export { getSelector };
    export { encodeParams };
    export { decodeParams };
    export { encodeResult };
    export { decodeResult };
    export { getSignature as Signature };
    export { encodeParams as Params };
    export { decodeParams as DecodeParams };
    export { encodeResult as Result };
    export { decodeResult as DecodeResult };
    export { GetSelector };
}
import { getSignature } from "./getSignature.js";
declare const getSelector: (fn: any) => Uint8Array;
import { encodeParams } from "./encodeParams.js";
import { decodeParams } from "./decodeParams.js";
import { encodeResult } from "./encodeResult.js";
import { decodeResult } from "./decodeResult.js";
import { GetSelector } from "./getSelector.js";
//# sourceMappingURL=Function.d.ts.map
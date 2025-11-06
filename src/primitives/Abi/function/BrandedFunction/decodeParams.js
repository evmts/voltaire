import { decodeParameters } from "../../Encoding.js";
import {
	FunctionDecodingError,
	FunctionInvalidSelectorError,
} from "./errors.js";
import { getSelector } from "./getSelector.js";

/**
 * Decode function call data (verify selector and decode parameters)
 *
 * @template {string} TName
 * @template {import('./statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../../parameter/index.js').Parameter[]} TInputs
 * @template {readonly import('../../parameter/index.js').Parameter[]} TOutputs
 * @param {import('./BrandedFunction.js').Function<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
 * @param {Uint8Array} data - Encoded calldata
 * @returns {import('../../parameter/index.js').ParametersToPrimitiveTypes<TInputs>} Decoded arguments
 * @throws {FunctionDecodingError} If data is too short
 * @throws {FunctionInvalidSelectorError} If selector doesn't match
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
 * const decoded = decodeParams(func, encoded);
 * // ["0x742d35cc6634c0532925a3b844bc9e7595f251e3", 100n]
 * ```
 */
export function decodeParams(fn, data) {
	if (data.length < 4) {
		throw new FunctionDecodingError("Data too short for function selector");
	}
	const selector = data.slice(0, 4);
	const expectedSelector = getSelector(fn);
	for (let i = 0; i < 4; i++) {
		const selByte = selector[i];
		const expByte = expectedSelector[i];
		if (selByte !== expByte) {
			throw new FunctionInvalidSelectorError();
		}
	}
	return /** @type {any} */ (decodeParameters(fn.inputs, data.slice(4)));
}

import { encodeParameters } from "../Encoding.js";
import { getSelector } from "./getSelector.js";

/**
 * Encode error parameters with selector prefix
 *
 * @template {string} TName
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @param {import('./BrandedError.js').BrandedError<TName, TInputs>} error - ABI error definition
 * @param {import('../Parameter.js').ParametersToPrimitiveTypes<TInputs>} args - Parameter values to encode
 * @returns {Uint8Array} Encoded error data with 4-byte selector prefix
 *
 * @example
 * ```typescript
 * const error = { type: "error", name: "InsufficientBalance", inputs: [{ type: "uint256", name: "balance" }] };
 * const encoded = encodeParams(error, [100n]); // Uint8Array with selector + encoded params
 * ```
 */
export function encodeParams(error, args) {
	const selector = getSelector(error);
	const encoded = encodeParameters(error.inputs, args);
	const result = new Uint8Array(selector.length + encoded.length);
	result.set(selector, 0);
	result.set(encoded, selector.length);
	return result;
}

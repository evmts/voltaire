import { decodeParameters } from "../../Encoding.js";
import { AbiDecodingError, AbiInvalidSelectorError } from "../../Errors.js";
import { getSelector } from "./index.js";

/**
 * Decode error parameters from encoded data
 *
 * @template {string} TName
 * @template {readonly import('../../parameter/index.js').BrandedParameter[]} TInputs
 * @param {import('./BrandedError.js').BrandedError<TName, TInputs>} error - ABI error definition
 * @param {Uint8Array} data - Encoded error data with selector prefix
 * @returns {import('../../Parameter.js').ParametersToPrimitiveTypes<TInputs>} Decoded parameter values
 * @throws {AbiDecodingError} If data is too short for selector
 * @throws {AbiInvalidSelectorError} If selector doesn't match expected
 *
 * @example
 * ```typescript
 * const error = { type: "error", name: "InsufficientBalance", inputs: [{ type: "uint256", name: "balance" }] };
 * const decoded = decodeParams(error, encodedData); // [100n]
 * ```
 */
export function decodeParams(error, data) {
	if (data.length < 4) {
		throw new AbiDecodingError("Data too short for error selector", {
			context: { dataLength: data.length, errorName: error.name },
		});
	}
	const selector = data.slice(0, 4);
	const expectedSelector = getSelector(error);
	for (let i = 0; i < 4; i++) {
		const selByte = selector[i];
		const expByte = expectedSelector[i];
		if (selByte !== expByte) {
			const selectorHex = `0x${Array.from(selector)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;
			const expectedHex = `0x${Array.from(expectedSelector)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;
			throw new AbiInvalidSelectorError("Error selector mismatch", {
				value: selector,
				expected: expectedHex,
				context: {
					selector: selectorHex,
					expectedSelector: expectedHex,
					errorName: error.name,
				},
			});
		}
	}
	return decodeParameters(error.inputs, data.slice(4));
}

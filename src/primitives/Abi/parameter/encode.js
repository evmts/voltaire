import { AbiEncodingError } from "../Errors.js";

/**
 * Encode single parameter (branded method - not implemented)
 *
 * @this {import('../Parameter.js').Parameter}
 * @param {unknown} _value - Value to encode
 * @returns {Uint8Array} Encoded parameter
 * @throws {AbiEncodingError} Always throws - not implemented
 *
 * @example
 * ```typescript
 * const param = { type: "uint256", name: "amount" };
 * Abi.Parameter.encode.call(param, 100n); // throws AbiEncodingError
 * ```
 */
export function encode(_value) {
	throw new AbiEncodingError(
		"Parameter.encode is not implemented. Use Abi.encodeParameters instead.",
	);
}

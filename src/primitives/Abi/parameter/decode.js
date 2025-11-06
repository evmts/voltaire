import { AbiDecodingError } from "../Errors.js";

/**
 * Decode single parameter (branded method - not implemented)
 *
 * @this {import('../Parameter.js').Parameter}
 * @param {Uint8Array} _data - Encoded data
 * @returns {unknown} Decoded value
 * @throws {AbiDecodingError} Always throws - not implemented
 *
 * @example
 * ```typescript
 * const param = { type: "uint256", name: "amount" };
 * Abi.Parameter.decode.call(param, data); // throws AbiDecodingError
 * ```
 */
export function decode(_data) {
	throw new AbiDecodingError(
		"Parameter.decode is not implemented. Use Abi.decodeParameters instead.",
	);
}

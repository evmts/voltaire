import { decodeParameters } from "../Encoding.js";

/**
 * Decode constructor parameters
 *
 * @param {import('./BrandedConstructor.js').BrandedConstructor} constructor - Constructor definition
 * @param {Uint8Array} data - Encoded data to decode
 * @returns {any[]} Decoded parameters
 *
 * @example
 * ```typescript
 * const constructor = {
 *   type: "constructor",
 *   stateMutability: "nonpayable",
 *   inputs: [{ type: "uint256" }]
 * };
 * const decoded = Constructor.decodeParams(constructor, encodedData);
 * ```
 */
export function decodeParams(constructor, data) {
	return /** @type {any[]} */ (decodeParameters(constructor.inputs, data));
}

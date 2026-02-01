import { decodeParameters } from "../Encoding.js";

/**
 * Decode constructor parameters
 *
 * @param {import('./ConstructorType.js').ConstructorType} constructor - Constructor definition
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
// biome-ignore lint/suspicious/noShadowRestrictedNames: constructor is the domain-specific parameter name for ABI constructor type
export function decodeParams(constructor, data) {
	return /** @type {any[]} */ (decodeParameters(constructor.inputs, data));
}

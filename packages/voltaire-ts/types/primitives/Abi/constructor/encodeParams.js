import { encodeParameters } from "../Encoding.js";
/**
 * Encode constructor parameters
 *
 * @param {import('./ConstructorType.js').ConstructorType} constructor - Constructor definition
 * @param {import('../Parameter.js').ParametersToPrimitiveTypes<any>} args - Arguments to encode
 * @returns {Uint8Array} Encoded parameters
 *
 * @example
 * ```typescript
 * const constructor = {
 *   type: "constructor",
 *   stateMutability: "nonpayable",
 *   inputs: [{ type: "uint256" }]
 * };
 * const encoded = Constructor.encodeParams(constructor, [123n]);
 * ```
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: constructor is the domain-specific parameter name for ABI constructor type
export function encodeParams(constructor, args) {
    return encodeParameters(constructor.inputs, args);
}

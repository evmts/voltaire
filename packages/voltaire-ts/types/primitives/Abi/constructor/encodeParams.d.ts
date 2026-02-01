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
export function encodeParams(constructor: import("./ConstructorType.js").ConstructorType, args: import("../Parameter.js").ParametersToPrimitiveTypes<any>): Uint8Array;
//# sourceMappingURL=encodeParams.d.ts.map
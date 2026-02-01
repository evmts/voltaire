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
export function decodeParams(constructor: import("./ConstructorType.js").ConstructorType, data: Uint8Array): any[];
//# sourceMappingURL=decodeParams.d.ts.map
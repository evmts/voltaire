/**
 * Decode single parameter (branded method - not implemented)
 *
 * @this {import('./ParameterType.js').ParameterType}
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
export function decode(this: import("./ParameterType.js").ParameterType<import("../Type.js").AbiType, string, string>, _data: Uint8Array): unknown;
//# sourceMappingURL=decode.d.ts.map
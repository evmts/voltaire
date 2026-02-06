/**
 * Encode single parameter (branded method - not implemented)
 *
 * @this {import('./ParameterType.js').ParameterType}
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
export function encode(this: import("./ParameterType.js").ParameterType<import("../Type.js").AbiType, string, string>, _value: unknown): Uint8Array;
//# sourceMappingURL=encode.d.ts.map
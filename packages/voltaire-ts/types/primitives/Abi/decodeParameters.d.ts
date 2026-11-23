/**
 * Decode ABI-encoded parameters.
 *
 * One decode budget (element count and copied bytes) is shared by every
 * top-level parameter and nested value, so offsets that alias the same tail
 * from several parameters cannot multiply the work or memory of a decode.
 *
 * @template {readonly Parameter[]} TParams
 * @param {TParams} params
 * @param {Uint8Array} data
 * @returns {ParametersToPrimitiveTypes<TParams>}
 * @throws {import("./Errors.js").AbiDecodingError} If the data is malformed or the decode budget is exceeded
 */
export function decodeParameters<TParams extends readonly Parameter[]>(params: TParams, data: Uint8Array): ParametersToPrimitiveTypes<TParams>;
import type { Parameter } from "./Parameter.js";
import type { ParametersToPrimitiveTypes } from "./Parameter.js";
//# sourceMappingURL=decodeParameters.d.ts.map
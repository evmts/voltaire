/**
 * @template {readonly Parameter[]} TParams
 * @param {TParams} params
 * @param {Uint8Array} data
 * @returns {ParametersToPrimitiveTypes<TParams>}
 */
export function decodeParameters<TParams extends readonly Parameter[]>(params: TParams, data: Uint8Array): ParametersToPrimitiveTypes<TParams>;
import type { Parameter } from "./Parameter.js";
import type { ParametersToPrimitiveTypes } from "./Parameter.js";
//# sourceMappingURL=decodeParameters.d.ts.map
/**
 * @template {readonly Parameter[]} TParams
 * @param {TParams} params
 * @param {ParametersToPrimitiveTypes<TParams>} values
 * @returns {Uint8Array}
 */
export function encodeParameters<TParams extends readonly Parameter[]>(params: TParams, values: ParametersToPrimitiveTypes<TParams>): Uint8Array;
import type { Parameter } from "./Parameter.js";
import type { ParametersToPrimitiveTypes } from "./Parameter.js";
//# sourceMappingURL=encodeParameters.d.ts.map
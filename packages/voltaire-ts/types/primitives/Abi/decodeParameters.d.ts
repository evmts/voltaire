/**
 * Decode ABI-encoded parameters using Voltaire-native output types.
 *
 * @template {readonly Parameter[]} TParams
 * @overload
 * @param {TParams} params
 * @param {Uint8Array} data
 * @param {{ format?: "voltaire" }} [options]
 * @returns {ParametersToPrimitiveTypes<TParams>}
 */
export function decodeParameters<TParams extends readonly Parameter[]>(params: TParams, data: Uint8Array, options?: {
    format?: "voltaire";
} | undefined): ParametersToPrimitiveTypes<TParams>;
/**
 * Decode ABI-encoded parameters using viem `decodeAbiParameters` output types.
 *
 * @template {readonly import('abitype').AbiParameter[]} TParams
 * @overload
 * @param {TParams} params
 * @param {Uint8Array | `0x${string}`} data
 * @param {{ format: "viem" }} options
 * @returns {import('abitype').AbiParametersToPrimitiveTypes<TParams>}
 */
export function decodeParameters<TParams extends readonly Parameter[]>(params: TParams, data: Uint8Array | `0x${string}`, options: {
    format: "viem";
}): import("abitype").AbiParametersToPrimitiveTypes<TParams>;
export type DecodeParametersOptions = {
    format?: "voltaire" | "viem";
};
import type { Parameter } from "./Parameter.js";
import type { ParametersToPrimitiveTypes } from "./Parameter.js";
//# sourceMappingURL=decodeParameters.d.ts.map
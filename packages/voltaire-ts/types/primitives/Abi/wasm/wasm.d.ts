import type { Parameter, ParametersToPrimitiveTypes } from "../Parameter.js";
import * as abiTs from "../Encoding.js";
export declare function encodeParametersWasm<const TParams extends readonly Parameter[]>(params: TParams, values: ParametersToPrimitiveTypes<TParams>): Uint8Array;
export declare function decodeParametersWasm<const TParams extends readonly Parameter[]>(params: TParams, data: Uint8Array): ParametersToPrimitiveTypes<TParams>;
export declare function encodeFunctionDataWasm<const TParams extends readonly Parameter[]>(signature: string, params: TParams, values: ParametersToPrimitiveTypes<TParams>): Uint8Array;
export declare function decodeFunctionDataWasm<const TParams extends readonly Parameter[]>(signature: string, params: TParams, data: Uint8Array): ParametersToPrimitiveTypes<TParams>;
export declare function encodePackedWasm(types: readonly string[], values: readonly unknown[]): Uint8Array;
export declare const encodeParameters: typeof abiTs.encodeParameters;
export declare const decodeParameters: typeof abiTs.decodeParameters;
export declare function isWasmAbiAvailable(): boolean;
export declare function getImplementationStatus(): {
    wasmAvailable: boolean;
    implemented: string[];
    notImplemented: string[];
};
//# sourceMappingURL=wasm.d.ts.map
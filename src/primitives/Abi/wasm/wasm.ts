import * as loader from "../../../wasm-loader/loader.js";
import type { Parameter, ParametersToPrimitiveTypes } from "../Parameter.js";

import * as abiTs from "../Encoding.js";

function formatValueForWasm(type: string, value: unknown): string {
  if (type === "address") {
    return String(value);
  }
  if (type.startsWith("uint") || type.startsWith("int")) {
    return String(value);
  }
  if (type === "bool") {
    return value ? "true" : "false";
  }
  if (type === "string") {
    return String(value);
  }
  if (type === "bytes" || type.startsWith("bytes")) {
    return loader.bytesToHex(value as Uint8Array);
  }
  if (type.endsWith("[]")) {
    const arr = value as unknown[];
    return JSON.stringify(arr.map((v) => formatValueForWasm(type.slice(0, -2), v)));
  }
  if (type === "tuple") {
    return JSON.stringify(value);
  }
  return String(value);
}

function parseValueFromWasm(type: string, value: unknown): unknown {
  if (type === "address") {
    return value;
  }
  if (type.startsWith("uint") || type.startsWith("int")) {
    return BigInt(value as string);
  }
  if (type === "bool") {
    return value === true || value === "true";
  }
  if (type === "string") {
    return value;
  }
  if (type === "bytes" || type.startsWith("bytes")) {
    return loader.hexToBytes(value as string);
  }
  if (type.endsWith("[]")) {
    const arr = value as unknown[];
    return arr.map((v) => parseValueFromWasm(type.slice(0, -2), v));
  }
  if (type === "tuple") {
    return value;
  }
  return value;
}

export function encodeParametersWasm<const TParams extends readonly Parameter[]>(
  params: TParams,
  values: ParametersToPrimitiveTypes<TParams>,
): Uint8Array {
  const types = params.map((p: Parameter) => p.type);
  const valueStrs = values.map((v: unknown, i: number) => formatValueForWasm(params[i]!.type, v));
  return loader.abiEncodeParameters(types, valueStrs);
}

export function decodeParametersWasm<const TParams extends readonly Parameter[]>(
  params: TParams,
  data: Uint8Array,
): ParametersToPrimitiveTypes<TParams> {
  const types = params.map((p: Parameter) => p.type);
  const decoded = loader.abiDecodeParameters(data, types);
  return decoded.map((d: unknown, i: number) => parseValueFromWasm(params[i]!.type, d)) as any;
}

export function encodeFunctionDataWasm<const TParams extends readonly Parameter[]>(
  _signature: string,
  _params: TParams,
  _values: ParametersToPrimitiveTypes<TParams>,
): Uint8Array {
  throw new Error(
    "encodeFunctionDataWasm not yet implemented - waiting for C ABI layer"
  );
}

export function decodeFunctionDataWasm<const TParams extends readonly Parameter[]>(
  _signature: string,
  _params: TParams,
  _data: Uint8Array,
): ParametersToPrimitiveTypes<TParams> {
  throw new Error(
    "decodeFunctionDataWasm not yet implemented - waiting for C ABI layer"
  );
}

export function encodeEventTopicsWasm(
  _signature: string,
  _params: readonly Parameter[],
  _values: Record<string, unknown>,
): Uint8Array[] {
  throw new Error(
    "encodeEventTopicsWasm not yet implemented - waiting for C ABI layer"
  );
}

export function decodeEventLogWasm(
  _signature: string,
  _params: readonly Parameter[],
  _data: Uint8Array,
  _topics: readonly Uint8Array[],
): Record<string, unknown> {
  throw new Error(
    "decodeEventLogWasm not yet implemented - waiting for C ABI layer"
  );
}

export function encodePackedWasm(
  _types: readonly string[],
  _values: readonly unknown[],
): Uint8Array {
  throw new Error(
    "encodePackedWasm not yet implemented - waiting for C ABI layer"
  );
}

export const encodeParameters = abiTs.encodeParameters;
export const decodeParameters = abiTs.decodeParameters;

export function isWasmAbiAvailable(): boolean {
  return true;
}

export function getImplementationStatus() {
  return {
    wasmAvailable: false,
    reason: "C ABI encoding/decoding layer not yet implemented",
    requiredFiles: [
      "src/c/abi_encoding.zig - Core ABI encoding/decoding logic",
      "src/wasm-loader/types.ts - Add ABI function signatures to WasmExports",
      "src/wasm-loader/loader.ts - Add ABI wrapper functions"
    ],
    estimatedFunctions: [
      "primitives_abi_encode_parameters",
      "primitives_abi_decode_parameters",
      "primitives_abi_encode_function_data",
      "primitives_abi_decode_function_data",
      "primitives_abi_encode_event_topics",
      "primitives_abi_decode_event_log",
      "primitives_abi_encode_packed"
    ]
  };
}

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
  signature: string,
  params: TParams,
  values: ParametersToPrimitiveTypes<TParams>,
): Uint8Array {
  const types = params.map((p: Parameter) => p.type);
  const valueStrs = values.map((v: unknown, i: number) => formatValueForWasm(params[i]!.type, v));
  return loader.abiEncodeFunctionData(signature, types, valueStrs);
}

export function decodeFunctionDataWasm<const TParams extends readonly Parameter[]>(
  signature: string,
  params: TParams,
  data: Uint8Array,
): ParametersToPrimitiveTypes<TParams> {
  const types = params.map((p: Parameter) => p.type);
  const result = loader.abiDecodeFunctionData(data, types);
  return result.parameters.map((d: string, i: number) => parseValueFromWasm(params[i]!.type, d)) as any;
}

export function encodePackedWasm(
  types: readonly string[],
  values: readonly unknown[],
): Uint8Array {
  const valueStrs = values.map((v, i) => formatValueForWasm(types[i]!, v));
  return loader.abiEncodePacked([...types], valueStrs);
}

export const encodeParameters = abiTs.encodeParameters;
export const decodeParameters = abiTs.decodeParameters;

export function isWasmAbiAvailable(): boolean {
  return true;
}

export function getImplementationStatus() {
  return {
    wasmAvailable: true,
    implemented: [
      "primitives_abi_encode_parameters",
      "primitives_abi_decode_parameters",
      "primitives_abi_encode_function_data",
      "primitives_abi_decode_function_data",
      "primitives_abi_encode_packed",
      "primitives_abi_estimate_gas",
      "primitives_abi_compute_selector"
    ],
    notImplemented: [
      "primitives_abi_encode_event_topics - Event topic encoding not yet exposed",
      "primitives_abi_decode_event_log - Event log decoding not yet exposed"
    ]
  };
}

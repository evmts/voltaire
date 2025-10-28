/**
 * WASM-accelerated ABI encoding/decoding
 *
 * Functions suffixed with `Wasm` use WebAssembly for performance.
 * Pure TypeScript implementations available without suffix.
 *
 * @status PARTIAL - C API layer not yet implemented
 * Waiting for C ABI implementation in src/c/abi_encoding.zig
 */

import * as loader from "../wasm-loader/loader.js";
import type { Abi } from "./abi.js";

// Import pure TS implementations for fallback
import * as abiTs from "./abi.js";

// Re-export pure TS namespace
export { Abi } from "./abi.js";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert TS value to WASM-friendly string representation
 * @internal
 */
function formatValueForWasm(type: string, value: unknown): string {
  if (type === "address") {
    return String(value); // Already hex string
  }
  if (type.startsWith("uint") || type.startsWith("int")) {
    return String(value); // bigint toString
  }
  if (type === "bool") {
    return value ? "true" : "false";
  }
  if (type === "string") {
    return String(value);
  }
  if (type === "bytes" || type.startsWith("bytes")) {
    // Convert Uint8Array to hex string
    return loader.bytesToHex(value as Uint8Array);
  }
  if (type.endsWith("[]")) {
    // Array type
    const arr = value as unknown[];
    return JSON.stringify(arr.map((v) => formatValueForWasm(type.slice(0, -2), v)));
  }
  if (type === "tuple") {
    // Tuple/struct type
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Parse WASM result back to TS type
 * @internal
 */
function parseValueFromWasm(type: string, value: unknown): unknown {
  if (type === "address") {
    return value; // Already string
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
    // Array type
    const arr = value as unknown[];
    return arr.map((v) => parseValueFromWasm(type.slice(0, -2), v));
  }
  if (type === "tuple") {
    // Tuple/struct type - already parsed
    return value;
  }
  return value;
}

// ============================================================================
// WASM-Accelerated Encoding Functions
// ============================================================================

/**
 * Encode ABI parameters using WASM
 *
 * @param params - Parameter definitions
 * @param values - Values to encode
 * @returns Encoded bytes
 *
 * @throws {Error} Not yet implemented - waiting for C API
 *
 * @example
 * ```typescript
 * const params = [{ type: 'address' }, { type: 'uint256' }];
 * const encoded = encodeParametersWasm(params, [address, amount]);
 * ```
 */
export function encodeParametersWasm<const TParams extends readonly Abi.Parameter[]>(
  params: TParams,
  values: Abi.ParametersToPrimitiveTypes<TParams>,
): Uint8Array {
  const types = params.map(p => p.type);
  const valueStrs = values.map((v, i) => formatValueForWasm(params[i].type, v));
  return loader.abiEncodeParameters(types, valueStrs);
}

/**
 * Decode ABI parameters using WASM
 *
 * @param params - Parameter definitions
 * @param data - Encoded data
 * @returns Decoded values
 *
 * @throws {Error} Not yet implemented - waiting for C API
 *
 * @example
 * ```typescript
 * const params = [{ type: 'address' }, { type: 'uint256' }];
 * const decoded = decodeParametersWasm(params, data);
 * ```
 */
export function decodeParametersWasm<const TParams extends readonly Abi.Parameter[]>(
  params: TParams,
  data: Uint8Array,
): Abi.ParametersToPrimitiveTypes<TParams> {
  const types = params.map(p => p.type);
  const decoded = loader.abiDecodeParameters(data, types);
  return decoded.map((d, i) => parseValueFromWasm(params[i].type, d)) as any;
}

/**
 * Encode function calldata using WASM (selector + parameters)
 *
 * @param signature - Function signature string (e.g., "transfer(address,uint256)")
 * @param params - Parameter definitions
 * @param values - Values to encode
 * @returns Encoded calldata (4-byte selector + encoded parameters)
 *
 * @throws {Error} Not yet implemented - waiting for C API
 *
 * @example
 * ```typescript
 * const calldata = encodeFunctionDataWasm(
 *   "transfer(address,uint256)",
 *   [{ type: 'address' }, { type: 'uint256' }],
 *   [address, amount]
 * );
 * ```
 */
export function encodeFunctionDataWasm<const TParams extends readonly Abi.Parameter[]>(
  signature: string,
  params: TParams,
  values: Abi.ParametersToPrimitiveTypes<TParams>,
): Uint8Array {
  // TODO: Implement when C API is ready
  // This should call both selector computation and parameter encoding

  throw new Error(
    "encodeFunctionDataWasm not yet implemented - waiting for C ABI layer"
  );

  // Implementation sketch:
  // const selector = Abi.getFunctionSelector(signature);
  // const encoded = encodeParametersWasm(params, values);
  // return new Uint8Array([...selector, ...encoded]);
}

/**
 * Decode function calldata using WASM
 *
 * @param signature - Function signature string
 * @param params - Parameter definitions
 * @param data - Calldata to decode (must start with selector)
 * @returns Decoded parameter values
 *
 * @throws {Error} Not yet implemented - waiting for C API
 *
 * @example
 * ```typescript
 * const args = decodeFunctionDataWasm(
 *   "transfer(address,uint256)",
 *   [{ type: 'address' }, { type: 'uint256' }],
 *   calldata
 * );
 * ```
 */
export function decodeFunctionDataWasm<const TParams extends readonly Abi.Parameter[]>(
  signature: string,
  params: TParams,
  data: Uint8Array,
): Abi.ParametersToPrimitiveTypes<TParams> {
  // TODO: Implement when C API is ready

  throw new Error(
    "decodeFunctionDataWasm not yet implemented - waiting for C ABI layer"
  );

  // Implementation sketch:
  // // Verify selector matches
  // const expectedSelector = Abi.getFunctionSelector(signature);
  // const actualSelector = data.slice(0, 4);
  // if (!arraysEqual(expectedSelector, actualSelector)) {
  //   throw new Error("Selector mismatch");
  // }
  // return decodeParametersWasm(params, data.slice(4));
}

/**
 * Encode event topics for indexed parameters using WASM
 *
 * @param signature - Event signature string
 * @param params - Parameter definitions
 * @param values - Partial values (only indexed params)
 * @returns Array of topics (topic0 + indexed params)
 *
 * @throws {Error} Not yet implemented - waiting for C API
 *
 * @example
 * ```typescript
 * const topics = encodeEventTopicsWasm(
 *   "Transfer(address,address,uint256)",
 *   [
 *     { type: 'address', indexed: true },
 *     { type: 'address', indexed: true },
 *     { type: 'uint256', indexed: false }
 *   ],
 *   { from: address1, to: address2 }
 * );
 * ```
 */
export function encodeEventTopicsWasm(
  signature: string,
  params: readonly Abi.Parameter[],
  values: Record<string, unknown>,
): Uint8Array[] {
  // TODO: Implement when C API is ready

  throw new Error(
    "encodeEventTopicsWasm not yet implemented - waiting for C ABI layer"
  );

  // Implementation sketch:
  // const topic0 = Abi.getEventSelector(signature);
  // const indexedParams = params.filter(p => p.indexed);
  // const topics = [topic0];
  // for (const param of indexedParams) {
  //   if (param.name && values[param.name] !== undefined) {
  //     // Hash dynamic types, encode static types
  //     topics.push(encodeIndexedParam(param, values[param.name]));
  //   }
  // }
  // return topics;
}

/**
 * Decode event log using WASM
 *
 * @param signature - Event signature string
 * @param params - Parameter definitions
 * @param data - Non-indexed event data
 * @param topics - Event topics (topic0 + indexed params)
 * @returns Decoded event parameters
 *
 * @throws {Error} Not yet implemented - waiting for C API
 *
 * @example
 * ```typescript
 * const decoded = decodeEventLogWasm(
 *   "Transfer(address,address,uint256)",
 *   params,
 *   data,
 *   topics
 * );
 * ```
 */
export function decodeEventLogWasm(
  signature: string,
  params: readonly Abi.Parameter[],
  data: Uint8Array,
  topics: readonly Uint8Array[],
): Record<string, unknown> {
  // TODO: Implement when C API is ready

  throw new Error(
    "decodeEventLogWasm not yet implemented - waiting for C ABI layer"
  );

  // Implementation sketch:
  // // Verify topic0 matches
  // const expectedTopic0 = Abi.getEventSelector(signature);
  // if (!arraysEqual(expectedTopic0, topics[0])) {
  //   throw new Error("Event selector mismatch");
  // }
  //
  // // Decode indexed params from topics
  // // Decode non-indexed params from data
  // // Combine into object
}

/**
 * Encode packed parameters (Solidity's abi.encodePacked) using WASM
 *
 * @param types - Parameter types
 * @param values - Values to encode
 * @returns Tightly packed encoded data (no padding)
 *
 * @throws {Error} Not yet implemented - waiting for C API
 *
 * @example
 * ```typescript
 * const packed = encodePackedWasm(
 *   ['address', 'uint256'],
 *   [address, amount]
 * );
 * ```
 */
export function encodePackedWasm(
  types: readonly string[],
  values: readonly unknown[],
): Uint8Array {
  // TODO: Implement when C API is ready

  throw new Error(
    "encodePackedWasm not yet implemented - waiting for C ABI layer"
  );

  // Implementation notes:
  // - No 32-byte padding
  // - Dynamic types encoded directly without length prefix
  // - Static types encoded as minimal bytes
}

// ============================================================================
// Re-export Pure TypeScript Implementations
// ============================================================================

/**
 * Pure TypeScript implementations (fallback when WASM not available)
 * These are NOT yet implemented in abi.ts either
 */
export const encodeParameters = abiTs.Abi.encodeParameters;
export const decodeParameters = abiTs.Abi.decodeParameters;
export const encodePacked = abiTs.Abi.encodePacked;

// ============================================================================
// Status and Documentation
// ============================================================================

/**
 * Check if WASM ABI functions are available
 * @returns true when C implementation is ready
 */
export function isWasmAbiAvailable(): boolean {
  return true;
}

/**
 * Get implementation status
 * @returns Status information
 */
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

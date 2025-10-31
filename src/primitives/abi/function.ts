/**
 * ABI Function operations
 *
 * Operations for encoding and decoding ABI function calls and results.
 */

import type { Function, ParametersToPrimitiveTypes } from "./types.js";
import {
  AbiDecodingError,
  AbiInvalidSelectorError,
} from "./errors.js";
import { encodeParameters, decodeParameters } from "./encoding.js";
import { Hash } from "../hash.js";

/**
 * Get function selector (4 bytes)
 *
 * @throws {AbiEncodingError} If selector computation fails
 *
 * @example
 * ```typescript
 * const func: Function = { type: 'function', name: 'transfer', ... };
 * const selector = getSelector(func);
 * ```
 */
export function getSelector<T extends Function>(func: T): Uint8Array {
  const signature = getSignature(func);
  const hash = Hash.keccak256String(signature);
  return hash.slice(0, 4);
}

/**
 * Get function signature (e.g., "transfer(address,uint256)")
 *
 * @example
 * ```typescript
 * const func: Function = { type: 'function', name: 'transfer', ... };
 * const sig = getSignature(func);
 * ```
 */
export function getSignature<T extends Function>(func: T): string {
  const inputs = func.inputs.map((p) => p.type).join(",");
  return `${func.name}(${inputs})`;
}

/**
 * Encode function input parameters
 *
 * @param func - Function definition
 * @param args - Input argument values matching function inputs
 * @returns Encoded calldata (selector + encoded parameters)
 * @throws {AbiEncodingError} If encoding fails
 * @throws {AbiParameterMismatchError} If args don't match inputs
 *
 * @example
 * ```typescript
 * const func: Function = { type: 'function', name: 'transfer', ... };
 * const data = encodeParams(func, [address, amount]);
 * ```
 */
export function encodeParams<T extends Function>(
  func: T,
  args: ParametersToPrimitiveTypes<T["inputs"]>,
): Uint8Array {
  const selector = getSelector(func);
  const encoded = encodeParameters(func.inputs, args);
  const result = new Uint8Array(selector.length + encoded.length);
  result.set(selector, 0);
  result.set(encoded, selector.length);
  return result;
}

/**
 * Decode function input parameters from calldata
 *
 * @param func - Function definition
 * @param data - Calldata to decode (must start with function selector)
 * @returns Decoded input arguments
 * @throws {AbiDecodingError} If decoding fails
 * @throws {AbiInvalidSelectorError} If selector doesn't match
 *
 * @example
 * ```typescript
 * const func: Function = { type: 'function', name: 'transfer', ... };
 * const args = decodeParams(func, data);
 * ```
 */
export function decodeParams<T extends Function>(
  func: T,
  data: Uint8Array,
): ParametersToPrimitiveTypes<T["inputs"]> {
  if (data.length < 4) {
    throw new AbiDecodingError("Data too short for function selector");
  }
  const selector = data.slice(0, 4);
  const expectedSelector = getSelector(func);
  // Check selector match
  for (let i = 0; i < 4; i++) {
    const selByte = selector[i];
    const expByte = expectedSelector[i];
    if (selByte !== expByte) {
      throw new AbiInvalidSelectorError("Function selector mismatch");
    }
  }
  return decodeParameters(func.inputs, data.slice(4)) as any;
}

/**
 * Encode function output result
 *
 * @param func - Function definition
 * @param values - Output values matching function outputs
 * @returns Encoded result data
 * @throws {AbiEncodingError} If encoding fails
 * @throws {AbiParameterMismatchError} If values don't match outputs
 *
 * @example
 * ```typescript
 * const func: Function = { type: 'function', name: 'balanceOf', ... };
 * const result = encodeResult(func, [balance]);
 * ```
 */
export function encodeResult<T extends Function>(
  func: T,
  values: ParametersToPrimitiveTypes<T["outputs"]>,
): Uint8Array {
  return encodeParameters(func.outputs, values);
}

/**
 * Decode function output result
 *
 * @param func - Function definition
 * @param data - Result data to decode
 * @returns Decoded output values
 * @throws {AbiDecodingError} If decoding fails
 *
 * @example
 * ```typescript
 * const func: Function = { type: 'function', name: 'balanceOf', ... };
 * const result = decodeResult(func, data);
 * ```
 */
export function decodeResult<T extends Function>(
  func: T,
  data: Uint8Array,
): ParametersToPrimitiveTypes<T["outputs"]> {
  return decodeParameters(func.outputs, data) as any;
}

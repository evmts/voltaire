/**
 * ABI Error Operations
 *
 * Functions for working with ABI error definitions including selector computation,
 * signature generation, and parameter encoding/decoding.
 */

import type { Error, ParametersToPrimitiveTypes } from "./types.js";
import { AbiDecodingError, AbiInvalidSelectorError } from "./errors.js";
import { encodeParameters, decodeParameters } from "./encoding.js";
import { Hash } from "../hash.js";

/**
 * Get error selector (4 bytes)
 *
 * @example
 * ```typescript
 * const error: Error = { type: 'error', name: 'InsufficientBalance', ... };
 * const selector = getSelector(error);
 * ```
 */
export function getSelector<T extends Error>(error: T): Uint8Array {
  const signature = getSignature(error);
  const hash = Hash.keccak256String(signature);
  return hash.slice(0, 4);
}

/**
 * Get error signature (e.g., "InsufficientBalance(uint256,uint256)")
 *
 * @example
 * ```typescript
 * const error: Error = { type: 'error', name: 'InsufficientBalance', ... };
 * const sig = getSignature(error);
 * ```
 */
export function getSignature<T extends Error>(error: T): string {
  const inputs = error.inputs.map((p) => p.type).join(",");
  return `${error.name}(${inputs})`;
}

/**
 * Encode error parameters
 *
 * @param args - Error parameter values
 * @returns Encoded error data (selector + encoded parameters)
 *
 * @example
 * ```typescript
 * const error: Error = { type: 'error', name: 'InsufficientBalance', ... };
 * const data = encodeParams(error, [available, required]);
 * ```
 */
export function encodeParams<T extends Error>(
  error: T,
  args: ParametersToPrimitiveTypes<T["inputs"]>,
): Uint8Array {
  const selector = getSelector(error);
  const encoded = encodeParameters(error.inputs, args);
  const result = new Uint8Array(selector.length + encoded.length);
  result.set(selector, 0);
  result.set(encoded, selector.length);
  return result;
}

/**
 * Decode error parameters
 *
 * @param data - Error data to decode (must start with error selector)
 * @returns Decoded error parameters
 * @throws {AbiDecodingError} If decoding fails
 * @throws {AbiInvalidSelectorError} If selector doesn't match
 *
 * @example
 * ```typescript
 * const error: Error = { type: 'error', name: 'InsufficientBalance', ... };
 * const params = decodeParams(error, data);
 * ```
 */
export function decodeParams<T extends Error>(
  error: T,
  data: Uint8Array,
): ParametersToPrimitiveTypes<T["inputs"]> {
  if (data.length < 4) {
    throw new AbiDecodingError("Data too short for error selector");
  }
  const selector = data.slice(0, 4);
  const expectedSelector = getSelector(error);
  // Check selector match
  for (let i = 0; i < 4; i++) {
    const selByte = selector[i];
    const expByte = expectedSelector[i];
    if (selByte !== expByte) {
      throw new AbiInvalidSelectorError("Error selector mismatch");
    }
  }
  return decodeParameters(error.inputs, data.slice(4)) as any;
}

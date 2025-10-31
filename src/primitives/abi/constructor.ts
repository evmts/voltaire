/**
 * ABI Constructor operations
 */

import type { Constructor, ParametersToPrimitiveTypes } from "./types.js";
import { encodeParameters, decodeParameters } from "./encoding.js";

/**
 * Encode constructor parameters with bytecode
 *
 * @param constructor - ABI constructor definition
 * @param bytecode - Contract bytecode
 * @param args - Constructor argument values
 * @returns Deploy data (bytecode + encoded constructor args)
 * @throws {AbiEncodingError} If encoding fails
 * @throws {AbiParameterMismatchError} If args don't match inputs
 *
 * @example
 * ```typescript
 * const constructor: Constructor = { type: 'constructor', ... };
 * const deployData = encodeParams(constructor, bytecode, [arg1, arg2]);
 * ```
 */
export function encodeParams<T extends Constructor>(
  constructor: T,
  bytecode: Uint8Array,
  args: ParametersToPrimitiveTypes<T["inputs"]>,
): Uint8Array {
  const encoded = encodeParameters(constructor.inputs, args);
  const result = new Uint8Array(bytecode.length + encoded.length);
  result.set(bytecode, 0);
  result.set(encoded, bytecode.length);
  return result;
}

/**
 * Decode constructor parameters from deploy data
 *
 * @param constructor - ABI constructor definition
 * @param data - Deploy transaction data
 * @param bytecodeLength - Length of contract bytecode
 * @returns Decoded constructor arguments
 * @throws {AbiDecodingError} If decoding fails
 *
 * @example
 * ```typescript
 * const constructor: Constructor = { type: 'constructor', ... };
 * const args = decodeParams(constructor, data, bytecode.length);
 * ```
 */
export function decodeParams<T extends Constructor>(
  constructor: T,
  data: Uint8Array,
  bytecodeLength: number,
): ParametersToPrimitiveTypes<T["inputs"]> {
  return decodeParameters(constructor.inputs, data.slice(bytecodeLength)) as ParametersToPrimitiveTypes<T["inputs"]>;
}

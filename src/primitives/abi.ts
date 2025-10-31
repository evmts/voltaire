/**
 * ABI (Application Binary Interface) Types and Utilities
 *
 * Complete ABI encoding/decoding with type inference matching viem.
 * All types namespaced under Abi for intuitive access.
 *
 * @example
 * ```typescript
 * import { Abi } from './abi.js';
 *
 * // Types
 * const func: Abi.Function = { ... };
 * const event: Abi.Event = { ... };
 *
 * // Operations
 * const data = Abi.Function.encodeFunctionData(func, args);
 * const logs = Abi.parseEventLogs(abi, logs);
 * ```
 */

import type { Address } from "./address.js";
import { Hash } from "./hash.js";
import type {
  AbiParameter as AbiTypeParameter,
  AbiFunction as _AbiTypeFunction,
  AbiEvent as _AbiTypeEvent,
  AbiError as _AbiTypeError,
  AbiConstructor as _AbiTypeConstructor,
  AbiParameterToPrimitiveType,
  AbiParametersToPrimitiveTypes as AbiTypeParametersToPrimitiveTypes,
} from "abitype";

// ============================================================================
// Error Types
// ============================================================================

export class AbiEncodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiEncodingError";
  }
}

export class AbiDecodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiDecodingError";
  }
}

export class AbiParameterMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiParameterMismatchError";
  }
}

export class AbiItemNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiItemNotFoundError";
  }
}

export class AbiInvalidSelectorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiInvalidSelectorError";
  }
}

// ============================================================================
// Main Abi Namespace
// ============================================================================

export namespace Abi {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  export type StateMutability = "pure" | "view" | "nonpayable" | "payable";

  /**
   * ABI Parameter with generic type tracking
   */
  export type Parameter<
    TType extends string = string,
    TName extends string = string,
    TInternalType extends string = string,
  > = {
    type: TType;
    name?: TName;
    internalType?: TInternalType;
    indexed?: boolean;
    components?: readonly Parameter[];
  };

  /**
   * ABI Function with generic tracking
   */
  export type Function<
    TName extends string = string,
    TStateMutability extends StateMutability = StateMutability,
    TInputs extends readonly Parameter[] = readonly Parameter[],
    TOutputs extends readonly Parameter[] = readonly Parameter[],
  > = {
    type: "function";
    name: TName;
    stateMutability: TStateMutability;
    inputs: TInputs;
    outputs: TOutputs;
  };

  /**
   * ABI Event with generic tracking
   */
  export type Event<
    TName extends string = string,
    TInputs extends readonly Parameter[] = readonly Parameter[],
  > = {
    type: "event";
    name: TName;
    inputs: TInputs;
    anonymous?: boolean;
  };

  /**
   * ABI Error with generic tracking
   */
  export type Error<
    TName extends string = string,
    TInputs extends readonly Parameter[] = readonly Parameter[],
  > = {
    type: "error";
    name: TName;
    inputs: TInputs;
  };

  /**
   * ABI Constructor with generic tracking
   */
  export type Constructor<
    TStateMutability extends StateMutability = StateMutability,
    TInputs extends readonly Parameter[] = readonly Parameter[],
  > = {
    type: "constructor";
    stateMutability: TStateMutability;
    inputs: TInputs;
  };

  /**
   * ABI Fallback
   */
  export type Fallback<TStateMutability extends StateMutability = StateMutability> = {
    type: "fallback";
    stateMutability: TStateMutability;
  };

  /**
   * ABI Receive
   */
  export type Receive = {
    type: "receive";
    stateMutability: "payable";
  };

  /**
   * Any ABI item
   */
  export type Item = Function | Event | Error | Constructor | Fallback | Receive;

  // ==========================================================================
  // Type Utilities
  // ==========================================================================

  /**
   * Extract function names from ABI
   */
  export type ExtractFunctionNames<TAbi extends readonly Item[]> = Extract<
    TAbi[number],
    { type: "function" }
  >["name"];

  /**
   * Extract event names from ABI
   */
  export type ExtractEventNames<TAbi extends readonly Item[]> = Extract<
    TAbi[number],
    { type: "event" }
  >["name"];

  /**
   * Extract error names from ABI
   */
  export type ExtractErrorNames<TAbi extends readonly Item[]> = Extract<
    TAbi[number],
    { type: "error" }
  >["name"];

  /**
   * Get function from ABI by name
   */
  export type GetFunction<TAbi extends readonly Item[], TName extends string> = Extract<
    TAbi[number],
    { type: "function"; name: TName }
  >;

  /**
   * Get event from ABI by name
   */
  export type GetEvent<TAbi extends readonly Item[], TName extends string> = Extract<
    TAbi[number],
    { type: "event"; name: TName }
  >;

  /**
   * Get error from ABI by name
   */
  export type GetError<TAbi extends readonly Item[], TName extends string> = Extract<
    TAbi[number],
    { type: "error"; name: TName }
  >;

  /**
   * Convert ABI parameters to primitive TypeScript types
   *
   * Enhanced with abitype for complete type inference including:
   * - uint/int variants -> bigint
   * - address -> Address (our custom type)
   * - bool -> boolean
   * - bytes/bytesN -> Uint8Array
   * - string -> string
   * - arrays -> Array<T>
   * - tuples -> readonly [T1, T2, ...]
   * - nested structs with full inference
   */
  export type ParametersToPrimitiveTypes<TParams extends readonly Parameter[]> = {
    [K in keyof TParams]: TParams[K] extends Parameter<infer TType, any, any>
      ? TType extends "address"
        ? Address // Use our custom Address type instead of abitype's `0x${string}`
        : TParams[K] extends AbiTypeParameter
          ? AbiParameterToPrimitiveType<TParams[K]>
          : AbiTypeParametersToPrimitiveTypes<[TParams[K] & AbiTypeParameter]>[0]
      : never;
  };

  /**
   * Convert ABI parameters to object with named properties
   *
   * Enhanced with abitype for complex types (tuples, arrays, nested structs)
   */
  export type ParametersToObject<TParams extends readonly Parameter[]> = {
    [K in TParams[number] as K extends { name: infer TName extends string }
      ? TName
      : never]: K extends Parameter<infer TType, any, any>
      ? TType extends "address"
        ? Address // Use our custom Address type
        : K extends AbiTypeParameter
          ? AbiParameterToPrimitiveType<K>
          : AbiTypeParametersToPrimitiveTypes<[K & AbiTypeParameter]>[0]
      : never;
  };

  // ==========================================================================
  // Internal Encoding/Decoding Helpers
  // ==========================================================================

  /**
   * Encode a uint256 value to 32 bytes (left-padded)
   * @internal
   */
  function encodeUint256(value: bigint): Uint8Array {
    if (typeof value !== 'bigint') {
      throw new AbiEncodingError(`encodeUint256 requires bigint, got ${typeof value}: ${value}`);
    }
    const result = new Uint8Array(32);
    let v = value;
    for (let i = 31; i >= 0; i--) {
      result[i] = Number(v & 0xffn);
      v >>= 8n;
    }
    return result;
  }

  /**
   * Encode a uint value of specific bit size (left-padded to 32 bytes)
   * @internal
   */
  function encodeUint(value: bigint | number, bits: number): Uint8Array {
    const bigintValue = typeof value === "number" ? BigInt(value) : value;
    const max = (1n << BigInt(bits)) - 1n;
    if (bigintValue < 0n || bigintValue > max) {
      throw new AbiEncodingError(`Value ${bigintValue} out of range for uint${bits}`);
    }
    return encodeUint256(bigintValue);
  }

  /**
   * Encode an int value of specific bit size (two's complement, left-padded to 32 bytes)
   * @internal
   */
  function encodeInt(value: bigint | number, bits: number): Uint8Array {
    const bigintValue = typeof value === "number" ? BigInt(value) : value;
    const min = -(1n << (BigInt(bits) - 1n));
    const max = (1n << (BigInt(bits) - 1n)) - 1n;
    if (bigintValue < min || bigintValue > max) {
      throw new AbiEncodingError(`Value ${bigintValue} out of range for int${bits}`);
    }
    // Two's complement for negative numbers
    const unsigned = bigintValue < 0n ? (1n << 256n) + bigintValue : bigintValue;
    return encodeUint256(unsigned);
  }

  /**
   * Pad bytes to 32-byte boundary (right-padded with zeros)
   * @internal
   */
  function padRight(data: Uint8Array): Uint8Array {
    const paddedLength = Math.ceil(data.length / 32) * 32;
    if (paddedLength === data.length) return data;
    const result = new Uint8Array(paddedLength);
    result.set(data, 0);
    return result;
  }

  /**
   * Check if type is dynamic
   * @internal
   */
  function isDynamicType(type: string): boolean {
    if (type === "string" || type === "bytes") return true;
    if (type.endsWith("[]")) return true;
    // Fixed-size arrays like uint256[3] are static if the element type is static
    if (type.includes("[") && type.endsWith("]")) {
      const match = type.match(/^(.+)\[(\d+)\]$/);
      if (match && match[1]) {
        const elementType = match[1];
        return isDynamicType(elementType);
      }
    }
    return false;
  }

  /**
   * Encode a single value based on its type
   * @internal
   */
  function encodeValue(
    type: string,
    value: unknown,
  ): { encoded: Uint8Array; isDynamic: boolean } {
    // Handle dynamic arrays first (before checking for uint)
    if (type.endsWith("[]")) {
      const elementType = type.slice(0, -2);
      const array = value as unknown[];
      const length = encodeUint256(BigInt(array.length));

      // Encode array elements
      const elementParams = array.map(() => ({ type: elementType }));
      const encodedElements = encodeParameters(
        elementParams as any,
        array as any,
      );

      const result = new Uint8Array(length.length + encodedElements.length);
      result.set(length, 0);
      result.set(encodedElements, length.length);
      return { encoded: result, isDynamic: true };
    }

    // Handle uint types
    if (type.startsWith("uint")) {
      const bits = type === "uint" ? 256 : parseInt(type.slice(4));
      const encoded = encodeUint(value as bigint | number, bits);
      return { encoded, isDynamic: false };
    }

    // Handle int types
    if (type.startsWith("int")) {
      const bits = type === "int" ? 256 : parseInt(type.slice(3));
      const encoded = encodeInt(value as bigint | number, bits);
      return { encoded, isDynamic: false };
    }

    // Handle address
    if (type === "address") {
      const addr = value as string;
      const hex = addr.toLowerCase().replace(/^0x/, "");
      if (hex.length !== 40) {
        throw new AbiEncodingError(`Invalid address length: ${hex.length}`);
      }
      const result = new Uint8Array(32);
      for (let i = 0; i < 20; i++) {
        result[12 + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      }
      return { encoded: result, isDynamic: false };
    }

    // Handle bool
    if (type === "bool") {
      const result = new Uint8Array(32);
      result[31] = value ? 1 : 0;
      return { encoded: result, isDynamic: false };
    }

    // Handle fixed-size bytes (bytes1-bytes32)
    if (type.startsWith("bytes") && type.length > 5) {
      const size = parseInt(type.slice(5));
      if (size >= 1 && size <= 32) {
        const bytes = value as Uint8Array;
        if (bytes.length !== size) {
          throw new AbiEncodingError(
            `Invalid ${type} length: expected ${size}, got ${bytes.length}`,
          );
        }
        const result = new Uint8Array(32);
        result.set(bytes, 0); // Right-pad with zeros
        return { encoded: result, isDynamic: false };
      }
    }

    // Handle dynamic bytes
    if (type === "bytes") {
      const bytes = value as Uint8Array;
      const length = encodeUint256(BigInt(bytes.length));
      const data = padRight(bytes);
      const result = new Uint8Array(length.length + data.length);
      result.set(length, 0);
      result.set(data, length.length);
      return { encoded: result, isDynamic: true };
    }

    // Handle string
    if (type === "string") {
      const str = value as string;
      const bytes = new TextEncoder().encode(str);
      const length = encodeUint256(BigInt(bytes.length));
      const data = padRight(bytes);
      const result = new Uint8Array(length.length + data.length);
      result.set(length, 0);
      result.set(data, length.length);
      return { encoded: result, isDynamic: true };
    }

    // Handle fixed-size arrays
    const fixedArrayMatch = type.match(/^(.+)\[(\d+)\]$/);
    if (fixedArrayMatch && fixedArrayMatch[1] && fixedArrayMatch[2]) {
      const elementType = fixedArrayMatch[1];
      const arraySize = parseInt(fixedArrayMatch[2]);
      const array = value as unknown[];

      if (array.length !== arraySize) {
        throw new AbiEncodingError(
          `Array length mismatch: expected ${arraySize}, got ${array.length}`,
        );
      }

      const elementParams = array.map(() => ({ type: elementType }));
      const encoded = encodeParameters(elementParams as any, array as any);
      const isDynamic = isDynamicType(elementType);
      return { encoded, isDynamic };
    }

    throw new AbiEncodingError(`Unsupported type: ${type}`);
  }

  /**
   * Decode a uint256 value from 32 bytes
   * @internal
   */
  function decodeUint256(data: Uint8Array, offset: number): bigint {
    if (offset + 32 > data.length) {
      throw new AbiDecodingError("Data too small for uint256");
    }
    let result = 0n;
    for (let i = 0; i < 32; i++) {
      result = (result << 8n) | BigInt(data[offset + i] ?? 0);
    }
    return result;
  }

  /**
   * Decode a single value based on its type
   * @internal
   */
  function decodeValue(
    type: string,
    data: Uint8Array,
    offset: number,
  ): { value: unknown; newOffset: number } {
    // Handle arrays first (before uint/int checks, since "uint256[]" starts with "uint")
    // Handle dynamic arrays
    if (type.endsWith("[]")) {
      const elementType = type.slice(0, -2);
      const dataOffset = Number(decodeUint256(data, offset));
      const length = Number(decodeUint256(data, dataOffset));

      const elementParams = Array(length).fill({ type: elementType });
      const value = decodeParameters(
        elementParams as any,
        data.slice(dataOffset + 32),
      );
      return { value, newOffset: offset + 32 };
    }

    // Handle fixed-size arrays
    const fixedArrayMatch = type.match(/^(.+)\[(\d+)\]$/);
    if (fixedArrayMatch && fixedArrayMatch[1] && fixedArrayMatch[2]) {
      const elementType = fixedArrayMatch[1];
      const arraySize = parseInt(fixedArrayMatch[2]);

      const elementParams = Array(arraySize).fill({ type: elementType });
      if (isDynamicType(elementType)) {
        // For dynamic element types, follow the offset
        const dataOffset = Number(decodeUint256(data, offset));
        const value = decodeParameters(elementParams as any, data.slice(dataOffset));
        return { value, newOffset: offset + 32 };
      } else {
        // For static element types, decode inline
        const value = decodeParameters(elementParams as any, data.slice(offset));
        return { value, newOffset: offset + arraySize * 32 };
      }
    }

    // Handle uint types
    if (type.startsWith("uint")) {
      const bits = type === "uint" ? 256 : parseInt(type.slice(4));
      const value = decodeUint256(data, offset);
      const max = (1n << BigInt(bits)) - 1n;
      if (value > max) {
        throw new AbiDecodingError(`Value ${value} out of range for ${type}`);
      }
      // Always return bigint for uint64 and above, number for smaller types
      if (bits < 64) {
        return { value: Number(value), newOffset: offset + 32 };
      }
      return { value, newOffset: offset + 32 };
    }

    // Handle int types
    if (type.startsWith("int")) {
      const bits = type === "int" ? 256 : parseInt(type.slice(3));
      const unsigned = decodeUint256(data, offset);

      // First, mask to the actual bit width
      const mask = (1n << BigInt(bits)) - 1n;
      const masked = unsigned & mask;

      // Check if the value has the sign bit set
      const signBitMask = 1n << (BigInt(bits) - 1n);
      let value: bigint;
      if (masked >= signBitMask) {
        // Negative number in two's complement
        // To get the actual negative value, subtract 2^bits
        value = masked - (1n << BigInt(bits));
      } else {
        // Positive number
        value = masked;
      }
      // Return as number for small ints (int32 and below), bigint for larger
      if (bits <= 32) {
        return { value: Number(value), newOffset: offset + 32 };
      }
      return { value, newOffset: offset + 32 };
    }

    // Handle address
    if (type === "address") {
      if (offset + 32 > data.length) {
        throw new AbiDecodingError("Data too small for address");
      }
      let hex = "0x";
      for (let i = 12; i < 32; i++) {
        const byte = data[offset + i];
        if (byte !== undefined) {
          hex += byte.toString(16).padStart(2, "0");
        }
      }
      return { value: hex, newOffset: offset + 32 };
    }

    // Handle bool
    if (type === "bool") {
      if (offset + 32 > data.length) {
        throw new AbiDecodingError("Data too small for bool");
      }
      // Check if any byte is non-zero
      let isTrue = false;
      for (let i = 0; i < 32; i++) {
        if (data[offset + i] !== 0) {
          isTrue = true;
          break;
        }
      }
      return { value: isTrue, newOffset: offset + 32 };
    }

    // Handle fixed-size bytes (bytes1-bytes32)
    if (type.startsWith("bytes") && type.length > 5) {
      const size = parseInt(type.slice(5));
      if (size >= 1 && size <= 32) {
        if (offset + 32 > data.length) {
          throw new AbiDecodingError(`Data too small for ${type}`);
        }
        const value = data.slice(offset, offset + size);
        return { value, newOffset: offset + 32 };
      }
    }

    // Handle dynamic bytes
    if (type === "bytes") {
      const dataOffset = Number(decodeUint256(data, offset));
      const length = Number(decodeUint256(data, dataOffset));
      if (dataOffset + 32 + length > data.length) {
        throw new AbiDecodingError("Data too small for bytes");
      }
      const value = data.slice(dataOffset + 32, dataOffset + 32 + length);
      return { value, newOffset: offset + 32 };
    }

    // Handle string
    if (type === "string") {
      const dataOffset = Number(decodeUint256(data, offset));
      const length = Number(decodeUint256(data, dataOffset));
      if (dataOffset + 32 + length > data.length) {
        throw new AbiDecodingError("Data too small for string");
      }
      const bytes = data.slice(dataOffset + 32, dataOffset + 32 + length);
      const value = new TextDecoder().decode(bytes);
      return { value, newOffset: offset + 32 };
    }

    throw new AbiDecodingError(`Unsupported type: ${type}`);
  }

  // ==========================================================================
  // Parameter Operations
  // ==========================================================================

  export namespace Parameter {
    /**
     * Encode single parameter value
     *
     * @param value - Value to encode
     * @returns Encoded parameter data
     * @throws {AbiEncodingError} If encoding fails
     *
     * @example
     * ```typescript
     * const param: Abi.Parameter = { type: 'uint256', name: 'amount' };
     * const encoded = Abi.Parameter.encode.call(param, 1000n);
     * ```
     */
    export function encode<T extends Abi.Parameter>(
      this: T,
      value: unknown,
    ): Uint8Array {
      const result = encodeValue(this.type, value);
      return result.encoded;
    }

    /**
     * Decode single parameter value
     *
     * @param data - Encoded data
     * @returns Decoded parameter value
     * @throws {AbiDecodingError} If decoding fails
     *
     * @example
     * ```typescript
     * const param: Abi.Parameter = { type: 'uint256', name: 'amount' };
     * const value = Abi.Parameter.decode.call(param, data);
     * ```
     */
    export function decode<T extends Abi.Parameter>(
      this: T,
      data: Uint8Array,
    ): unknown {
      return decodeValue(this.type, data, 0);
    }
  }

  /**
   * Encode ABI parameters
   *
   * @param params - Parameter definitions
   * @param values - Values to encode
   * @returns Encoded data
   * @throws {AbiEncodingError} If encoding fails
   * @throws {AbiParameterMismatchError} If values don't match params
   *
   * @example
   * ```typescript
   * const params = [{ type: 'address' }, { type: 'uint256' }];
   * const encoded = Abi.encodeParameters(params, [address, amount]);
   * ```
   */
  export function encodeParameters<const TParams extends readonly Parameter[]>(
    params: TParams,
    values: ParametersToPrimitiveTypes<TParams>,
  ): Uint8Array {
    if (params.length !== values.length) {
      throw new AbiParameterMismatchError(
        `Parameter count mismatch: expected ${params.length}, got ${values.length}`,
      );
    }

    // Separate static and dynamic data
    const staticParts: Uint8Array[] = [];
    const dynamicParts: Uint8Array[] = [];

    // First pass: collect all encodings
    const encodings: Array<{ encoded: Uint8Array; isDynamic: boolean }> = [];
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      if (!param) continue;
      const value = values[i];
      encodings.push(encodeValue(param.type, value));
    }

    // Calculate initial offset
    let dynamicOffset = params.length * 32; // Each static slot is 32 bytes

    // Second pass: build static and dynamic parts
    for (const { encoded, isDynamic } of encodings) {
      if (isDynamic) {
        // Static part: offset to dynamic data
        staticParts.push(encodeUint256(BigInt(dynamicOffset)));
        dynamicParts.push(encoded);
        dynamicOffset += encoded.length;
      } else {
        // Static part: actual value
        staticParts.push(encoded);
      }
    }

    // Concatenate all parts
    const totalLength = staticParts.reduce((sum, part) => sum + part.length, 0) +
                       dynamicParts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const part of staticParts) {
      result.set(part, offset);
      offset += part.length;
    }
    for (const part of dynamicParts) {
      result.set(part, offset);
      offset += part.length;
    }

    return result;
  }

  /**
   * Decode ABI parameters
   *
   * @param params - Parameter definitions
   * @param data - Encoded data
   * @returns Decoded values
   * @throws {AbiDecodingError} If decoding fails
   *
   * @example
   * ```typescript
   * const params = [{ type: 'address' }, { type: 'uint256' }];
   * const values = Abi.decodeParameters(params, data);
   * ```
   */
  export function decodeParameters<const TParams extends readonly Parameter[]>(
    params: TParams,
    data: Uint8Array,
  ): ParametersToPrimitiveTypes<TParams> {
    const result: unknown[] = [];
    let offset = 0;

    for (const param of params) {
      const { value } = decodeValue(param.type, data, offset);
      result.push(value);
      offset += 32; // Each parameter takes 32 bytes in static section
    }

    return result as ParametersToPrimitiveTypes<TParams>;
  }

  // ==========================================================================
  // Function Operations
  // ==========================================================================

  export namespace Function {
    /**
     * Get function selector (4 bytes)
     *
     * @throws {AbiEncodingError} If selector computation fails
     *
     * @example
     * ```typescript
     * const func: Abi.Function = { type: 'function', name: 'transfer', ... };
     * const selector = Abi.Function.getSelector.call(func);
     * ```
     */
    export function getSelector<T extends Abi.Function>(this: T): Uint8Array {
      const signature = getSignature.call(this);
      const hash = Hash.keccak256String(signature);
      return hash.slice(0, 4);
    }

    /**
     * Get function signature (e.g., "transfer(address,uint256)")
     *
     * @example
     * ```typescript
     * const func: Abi.Function = { type: 'function', name: 'transfer', ... };
     * const sig = Abi.Function.getSignature.call(func);
     * ```
     */
    export function getSignature<T extends Abi.Function>(this: T): string {
      const inputs = this.inputs.map((p) => p.type).join(",");
      return `${this.name}(${inputs})`;
    }

    /**
     * Encode function input parameters
     *
     * @param args - Input argument values matching function inputs
     * @returns Encoded calldata (selector + encoded parameters)
     * @throws {AbiEncodingError} If encoding fails
     * @throws {AbiParameterMismatchError} If args don't match inputs
     *
     * @example
     * ```typescript
     * const func: Abi.Function = { type: 'function', name: 'transfer', ... };
     * const data = Abi.Function.encodeParams.call(func, [address, amount]);
     * ```
     */
    export function encodeParams<T extends Abi.Function>(
      this: T,
      args: ParametersToPrimitiveTypes<T["inputs"]>,
    ): Uint8Array {
      const selector = getSelector.call(this);
      const encoded = encodeParameters(this.inputs, args);
      const result = new Uint8Array(selector.length + encoded.length);
      result.set(selector, 0);
      result.set(encoded, selector.length);
      return result;
    }

    /**
     * Decode function input parameters from calldata
     *
     * @param data - Calldata to decode (must start with function selector)
     * @returns Decoded input arguments
     * @throws {AbiDecodingError} If decoding fails
     * @throws {AbiInvalidSelectorError} If selector doesn't match
     *
     * @example
     * ```typescript
     * const func: Abi.Function = { type: 'function', name: 'transfer', ... };
     * const args = Abi.Function.decodeParams.call(func, data);
     * ```
     */
    export function decodeParams<T extends Abi.Function>(
      this: T,
      data: Uint8Array,
    ): ParametersToPrimitiveTypes<T["inputs"]> {
      if (data.length < 4) {
        throw new AbiDecodingError("Data too short for function selector");
      }
      const selector = data.slice(0, 4);
      const expectedSelector = getSelector.call(this);
      // Check selector match
      for (let i = 0; i < 4; i++) {
        const selByte = selector[i];
        const expByte = expectedSelector[i];
        if (selByte !== expByte) {
          throw new AbiInvalidSelectorError("Function selector mismatch");
        }
      }
      return decodeParameters(this.inputs, data.slice(4)) as any;
    }

    /**
     * Encode function output result
     *
     * @param values - Output values matching function outputs
     * @returns Encoded result data
     * @throws {AbiEncodingError} If encoding fails
     * @throws {AbiParameterMismatchError} If values don't match outputs
     *
     * @example
     * ```typescript
     * const func: Abi.Function = { type: 'function', name: 'balanceOf', ... };
     * const result = Abi.Function.encodeResult.call(func, [balance]);
     * ```
     */
    export function encodeResult<T extends Abi.Function>(
      this: T,
      values: ParametersToPrimitiveTypes<T["outputs"]>,
    ): Uint8Array {
      return encodeParameters(this.outputs, values);
    }

    /**
     * Decode function output result
     *
     * @param data - Result data to decode
     * @returns Decoded output values
     * @throws {AbiDecodingError} If decoding fails
     *
     * @example
     * ```typescript
     * const func: Abi.Function = { type: 'function', name: 'balanceOf', ... };
     * const result = Abi.Function.decodeResult.call(func, data);
     * ```
     */
    export function decodeResult<T extends Abi.Function>(
      this: T,
      data: Uint8Array,
    ): ParametersToPrimitiveTypes<T["outputs"]> {
      return decodeParameters(this.outputs, data) as any;
    }
  }

  // ==========================================================================
  // Event Operations
  // ==========================================================================

  export namespace Event {
    /**
     * Get event selector (32 bytes, topic0)
     *
     * @throws {AbiEncodingError} If selector computation fails
     *
     * @example
     * ```typescript
     * const event: Abi.Event = { type: 'event', name: 'Transfer', ... };
     * const selector = Abi.Event.getSelector.call(event);
     * ```
     */
    export function getSelector<T extends Abi.Event>(this: T): Hash {
      const signature = getSignature.call(this);
      return Hash.keccak256String(signature);
    }

    /**
     * Get event signature (e.g., "Transfer(address,address,uint256)")
     *
     * @example
     * ```typescript
     * const event: Abi.Event = { type: 'event', name: 'Transfer', ... };
     * const sig = Abi.Event.getSignature.call(event);
     * ```
     */
    export function getSignature<T extends Abi.Event>(this: T): string {
      const inputs = this.inputs.map((p) => p.type).join(",");
      return `${this.name}(${inputs})`;
    }

    /**
     * Encode event topics for indexed parameters
     *
     * @param args - Indexed parameter values (partial, only indexed params)
     * @returns Array of topics (topic0 + indexed params)
     * @throws {AbiEncodingError} If encoding fails
     *
     * @example
     * ```typescript
     * const event: Abi.Event = { type: 'event', name: 'Transfer', ... };
     * const topics = Abi.Event.encodeTopics.call(event, { from, to });
     * ```
     */
    export function encodeTopics<T extends Abi.Event>(
      this: T,
      args: Partial<ParametersToObject<T["inputs"]>>,
    ): (Hash | null)[] {
      const topics: (Hash | null)[] = [];

      // topic0: event selector (unless anonymous)
      if (!this.anonymous) {
        topics.push(getSelector.call(this));
      }

      // Encode indexed parameters
      for (const param of this.inputs) {
        if (!param.indexed) continue;

        const value = param.name ? (args as any)[param.name] : undefined;
        if (value === undefined || value === null) {
          topics.push(null);
          continue;
        }

        // For dynamic types (string, bytes, arrays), hash the value
        if (isDynamicType(param.type)) {
          const { encoded } = encodeValue(param.type, value);
          topics.push(Hash.keccak256(encoded));
        } else {
          // For static types, encode normally
          const { encoded } = encodeValue(param.type, value);
          topics.push(encoded as Hash);
        }
      }

      return topics;
    }

    /**
     * Decode event log
     *
     * @param data - Non-indexed event data
     * @param topics - Event topics (topic0 + indexed params)
     * @returns Decoded event parameters as object
     * @throws {AbiDecodingError} If decoding fails
     * @throws {AbiInvalidSelectorError} If topic0 doesn't match selector
     *
     * @example
     * ```typescript
     * const event: Abi.Event = { type: 'event', name: 'Transfer', ... };
     * const decoded = Abi.Event.decodeLog.call(event, data, topics);
     * ```
     */
    export function decodeLog<T extends Abi.Event>(
      this: T,
      data: Uint8Array,
      topics: readonly Hash[],
    ): ParametersToObject<T["inputs"]> {
      let topicIndex = 0;

      // Verify topic0 (selector) if not anonymous
      if (!this.anonymous) {
        if (topics.length === 0) {
          throw new AbiDecodingError("Missing topic0 for non-anonymous event");
        }
        const topic0 = topics[0];
        if (!topic0) {
          throw new AbiDecodingError("Missing topic0 for non-anonymous event");
        }
        const expectedSelector = getSelector.call(this);
        // Check selector match
        for (let i = 0; i < 32; i++) {
          const t0Byte = topic0[i];
          const expByte = expectedSelector[i];
          if (t0Byte !== expByte) {
            throw new AbiInvalidSelectorError("Event selector mismatch");
          }
        }
        topicIndex = 1;
      }

      const result: any = {};
      const nonIndexedParams: Parameter[] = [];

      // Decode indexed parameters from topics
      for (const param of this.inputs) {
        if (param.indexed) {
          if (topicIndex >= topics.length) {
            throw new AbiDecodingError(`Missing topic for indexed parameter ${param.name}`);
          }
          const topic = topics[topicIndex++];

          // For dynamic types, we can't decode (only have hash)
          if (isDynamicType(param.type)) {
            // Store the hash itself
            if (param.name) {
              result[param.name] = topic;
            }
          } else {
            // Decode static types
            const { value } = decodeValue(param.type, topic as Uint8Array, 0);
            if (param.name) {
              result[param.name] = value;
            }
          }
        } else {
          nonIndexedParams.push(param);
        }
      }

      // Decode non-indexed parameters from data
      if (nonIndexedParams.length > 0) {
        const decoded = decodeParameters(nonIndexedParams as any, data);
        for (let i = 0; i < nonIndexedParams.length; i++) {
          const param = nonIndexedParams[i];
          if (param && param.name) {
            result[param.name] = (decoded as any)[i];
          }
        }
      }

      return result as any;
    }
  }

  // ==========================================================================
  // Error Operations
  // ==========================================================================

  export namespace Error {
    /**
     * Get error selector (4 bytes)
     *
     * @throws {AbiEncodingError} If selector computation fails
     *
     * @example
     * ```typescript
     * const error: Abi.Error = { type: 'error', name: 'InsufficientBalance', ... };
     * const selector = Abi.Error.getSelector.call(error);
     * ```
     */
    export function getSelector<T extends Abi.Error>(this: T): Uint8Array {
      const signature = getSignature.call(this);
      const hash = Hash.keccak256String(signature);
      return hash.slice(0, 4);
    }

    /**
     * Get error signature (e.g., "InsufficientBalance(uint256,uint256)")
     *
     * @example
     * ```typescript
     * const error: Abi.Error = { type: 'error', name: 'InsufficientBalance', ... };
     * const sig = Abi.Error.getSignature.call(error);
     * ```
     */
    export function getSignature<T extends Abi.Error>(this: T): string {
      const inputs = this.inputs.map((p) => p.type).join(",");
      return `${this.name}(${inputs})`;
    }

    /**
     * Encode error parameters
     *
     * @param args - Error parameter values
     * @returns Encoded error data (selector + encoded parameters)
     * @throws {AbiEncodingError} If encoding fails
     * @throws {AbiParameterMismatchError} If args don't match inputs
     *
     * @example
     * ```typescript
     * const error: Abi.Error = { type: 'error', name: 'InsufficientBalance', ... };
     * const data = Abi.Error.encodeParams.call(error, [available, required]);
     * ```
     */
    export function encodeParams<T extends Abi.Error>(
      this: T,
      args: ParametersToPrimitiveTypes<T["inputs"]>,
    ): Uint8Array {
      const selector = getSelector.call(this);
      const encoded = encodeParameters(this.inputs, args);
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
     * const error: Abi.Error = { type: 'error', name: 'InsufficientBalance', ... };
     * const params = Abi.Error.decodeParams.call(error, data);
     * ```
     */
    export function decodeParams<T extends Abi.Error>(
      this: T,
      data: Uint8Array,
    ): ParametersToPrimitiveTypes<T["inputs"]> {
      if (data.length < 4) {
        throw new AbiDecodingError("Data too short for error selector");
      }
      const selector = data.slice(0, 4);
      const expectedSelector = getSelector.call(this);
      // Check selector match
      for (let i = 0; i < 4; i++) {
        const selByte = selector[i];
        const expByte = expectedSelector[i];
        if (selByte !== expByte) {
          throw new AbiInvalidSelectorError("Error selector mismatch");
        }
      }
      return decodeParameters(this.inputs, data.slice(4)) as any;
    }
  }

  // ==========================================================================
  // Constructor Operations
  // ==========================================================================

  export namespace Constructor {
    /**
     * Encode constructor parameters with bytecode
     *
     * @param bytecode - Contract bytecode
     * @param args - Constructor argument values
     * @returns Deploy data (bytecode + encoded constructor args)
     * @throws {AbiEncodingError} If encoding fails
     * @throws {AbiParameterMismatchError} If args don't match inputs
     *
     * @example
     * ```typescript
     * const constructor: Abi.Constructor = { type: 'constructor', ... };
     * const deployData = Abi.Constructor.encodeParams.call(constructor, bytecode, [arg1, arg2]);
     * ```
     */
    export function encodeParams<T extends Abi.Constructor>(
      this: T,
      bytecode: Uint8Array,
      args: ParametersToPrimitiveTypes<T["inputs"]>,
    ): Uint8Array {
      const encoded = encodeParameters(this.inputs, args);
      const result = new Uint8Array(bytecode.length + encoded.length);
      result.set(bytecode, 0);
      result.set(encoded, bytecode.length);
      return result;
    }

    /**
     * Decode constructor parameters from deploy data
     *
     * @param data - Deploy transaction data
     * @param bytecodeLength - Length of contract bytecode
     * @returns Decoded constructor arguments
     * @throws {AbiDecodingError} If decoding fails
     *
     * @example
     * ```typescript
     * const constructor: Abi.Constructor = { type: 'constructor', ... };
     * const args = Abi.Constructor.decodeParams.call(constructor, data, bytecode.length);
     * ```
     */
    export function decodeParams<T extends Abi.Constructor>(
      this: T,
      data: Uint8Array,
      bytecodeLength: number,
    ): ParametersToPrimitiveTypes<T["inputs"]> {
      return decodeParameters(this.inputs, data.slice(bytecodeLength)) as ParametersToPrimitiveTypes<T["inputs"]>;
    }
  }

  // ==========================================================================
  // Abi-Level Operations (operate on full ABI)
  // ==========================================================================

  /**
   * Get ABI item by name and optionally type
   */
  export function getItem<
    TAbi extends readonly Item[],
    TName extends string,
    TType extends Item["type"] | undefined = undefined,
  >(
    this: TAbi,
    name: TName,
    type?: TType,
  ): Extract<TAbi[number], { name: TName }> | undefined {
    return this.find(
      (item) =>
        "name" in item &&
        item.name === name &&
        (type === undefined || item.type === type),
    ) as any;
  }

  /**
   * Encode function data using function name
   *
   * @param functionName - Name of function to encode
   * @param args - Function argument values
   * @returns Encoded calldata (selector + params)
   * @throws {AbiItemNotFoundError} If function not found in ABI
   * @throws {AbiEncodingError} If encoding fails
   * @throws {AbiParameterMismatchError} If args don't match function inputs
   *
   * @example
   * ```typescript
   * const abi: Abi = [...];
   * const data = Abi.encode.call(abi, "transfer", [address, amount]);
   * ```
   */
  export function encode<
    TAbi extends readonly Item[],
    TFunctionName extends ExtractFunctionNames<TAbi>,
  >(
    this: TAbi,
    functionName: TFunctionName,
    args: ParametersToPrimitiveTypes<GetFunction<TAbi, TFunctionName>["inputs"]>,
  ): Uint8Array {
    const fn = getItem.call(this, functionName, "function");
    if (!fn) throw new AbiItemNotFoundError(`Function ${functionName} not found`);
    return Function.encodeParams.call(fn as any, args);
  }

  /**
   * Decode function result using function name
   *
   * @param functionName - Name of function to decode result for
   * @param data - Result data to decode
   * @returns Decoded output values
   * @throws {AbiItemNotFoundError} If function not found in ABI
   * @throws {AbiDecodingError} If decoding fails
   *
   * @example
   * ```typescript
   * const abi: Abi = [...];
   * const result = Abi.decode.call(abi, "balanceOf", data);
   * ```
   */
  export function decode<
    TAbi extends readonly Item[],
    TFunctionName extends ExtractFunctionNames<TAbi>,
  >(
    this: TAbi,
    functionName: TFunctionName,
    data: Uint8Array,
  ): ParametersToPrimitiveTypes<GetFunction<TAbi, TFunctionName>["outputs"]> {
    const fn = getItem.call(this, functionName, "function");
    if (!fn) throw new AbiItemNotFoundError(`Function ${functionName} not found`);
    return Function.decodeResult.call(fn as any, data) as any;
  }

  /**
   * Decode function call data (infer function from selector)
   *
   * @param data - Calldata to decode
   * @returns Decoded function name and arguments
   * @throws {AbiDecodingError} If decoding fails
   * @throws {AbiItemNotFoundError} If selector doesn't match any function
   *
   * @example
   * ```typescript
   * const abi: Abi = [...];
   * const { functionName, args } = Abi.decodeData.call(abi, calldata);
   * ```
   */
  export function decodeData<
    TAbi extends readonly Item[],
    TFunctionName extends ExtractFunctionNames<TAbi>,
  >(
    this: TAbi,
    data: Uint8Array,
  ): {
    functionName: TFunctionName;
    args: ParametersToPrimitiveTypes<GetFunction<TAbi, TFunctionName>["inputs"]>;
  } {
    if (data.length < 4) {
      throw new AbiDecodingError("Data too short for function selector");
    }

    const selector = data.slice(0, 4);

    // Find matching function by selector
    for (const item of this) {
      if (item.type !== "function") continue;

      const fn = item as Abi.Function;
      const fnSelector = Function.getSelector.call(fn);

      // Check if selector matches
      let matches = true;
      for (let i = 0; i < 4; i++) {
        if (selector[i] !== fnSelector[i]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        const args = Function.decodeParams.call(fn, data);
        return {
          functionName: fn.name as TFunctionName,
          args: args as any,
        };
      }
    }

    throw new AbiItemNotFoundError(
      `Function with selector 0x${Array.from(selector).map(b => b.toString(16).padStart(2, '0')).join('')} not found`,
    );
  }

  /**
   * Parse event logs from array of logs
   *
   * @param logs - Array of logs to parse
   * @returns Array of parsed event logs with decoded arguments
   * @throws {AbiDecodingError} If log decoding fails
   *
   * @example
   * ```typescript
   * const abi: Abi = [...];
   * const parsed = Abi.parseLogs.call(abi, logs);
   * ```
   */
  export function parseLogs<TAbi extends readonly Item[]>(
    this: TAbi,
    logs: Array<{ topics: readonly Hash[]; data: Uint8Array }>,
  ): Array<{
    eventName: ExtractEventNames<TAbi>;
    args: unknown;
    log: { topics: readonly Hash[]; data: Uint8Array };
  }> {
    const results: Array<{
      eventName: ExtractEventNames<TAbi>;
      args: unknown;
      log: { topics: readonly Hash[]; data: Uint8Array };
    }> = [];

    for (const log of logs) {
      if (log.topics.length === 0) continue;

      const topic0 = log.topics[0];
      if (!topic0) continue;

      // Find matching event by selector
      for (const item of this) {
        if (item.type !== "event") continue;

        const event = item as Abi.Event;

        // Skip anonymous events (they don't have topic0)
        if (event.anonymous) continue;

        const eventSelector = Event.getSelector.call(event);

        // Check if selector matches
        let matches = true;
        for (let i = 0; i < 32; i++) {
          const t0Byte = topic0[i];
          const evByte = eventSelector[i];
          if (t0Byte !== evByte) {
            matches = false;
            break;
          }
        }

        if (matches) {
          try {
            const args = Event.decodeLog.call(event, log.data, log.topics);
            results.push({
              eventName: event.name as ExtractEventNames<TAbi>,
              args,
              log,
            });
            break; // Found match, move to next log
          } catch (e) {
            // Decoding failed, try next event
            continue;
          }
        }
      }
    }

    return results;
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Encode packed (Solidity's abi.encodePacked)
   *
   * No padding, tightly packed encoding.
   */
  export function encodePacked(
    types: readonly string[],
    values: readonly unknown[],
  ): Uint8Array {
    if (types.length !== values.length) {
      throw new AbiEncodingError(
        `Type count mismatch: expected ${types.length}, got ${values.length}`,
      );
    }

    const parts: Uint8Array[] = [];

    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (!type) continue;
      const value = values[i];

      // Handle uint types - minimal encoding (no padding)
      if (type.startsWith("uint")) {
        const bits = type === "uint" ? 256 : parseInt(type.slice(4));
        const bytes = Math.ceil(bits / 8);
        const bigintValue = typeof value === "number" ? BigInt(value) : (value as bigint);
        const result = new Uint8Array(bytes);
        let v = bigintValue;
        for (let j = bytes - 1; j >= 0; j--) {
          result[j] = Number(v & 0xffn);
          v >>= 8n;
        }
        parts.push(result);
        continue;
      }

      // Handle int types - minimal encoding with two's complement
      if (type.startsWith("int")) {
        const bits = type === "int" ? 256 : parseInt(type.slice(3));
        const bytes = Math.ceil(bits / 8);
        const bigintValue = typeof value === "number" ? BigInt(value) : (value as bigint);
        const unsigned = bigintValue < 0n ? (1n << BigInt(bits)) + bigintValue : bigintValue;
        const result = new Uint8Array(bytes);
        let v = unsigned;
        for (let j = bytes - 1; j >= 0; j--) {
          result[j] = Number(v & 0xffn);
          v >>= 8n;
        }
        parts.push(result);
        continue;
      }

      // Handle address - 20 bytes, no padding
      if (type === "address") {
        const addr = value as string;
        const hex = addr.toLowerCase().replace(/^0x/, "");
        const result = new Uint8Array(20);
        for (let j = 0; j < 20; j++) {
          result[j] = parseInt(hex.slice(j * 2, j * 2 + 2), 16);
        }
        parts.push(result);
        continue;
      }

      // Handle bool - 1 byte
      if (type === "bool") {
        parts.push(new Uint8Array([value ? 1 : 0]));
        continue;
      }

      // Handle fixed-size bytes (bytes1-bytes32) - no padding
      if (type.startsWith("bytes") && type.length > 5) {
        const size = parseInt(type.slice(5));
        if (size >= 1 && size <= 32) {
          parts.push(value as Uint8Array);
          continue;
        }
      }

      // Handle dynamic bytes - no length prefix, just raw bytes
      if (type === "bytes") {
        parts.push(value as Uint8Array);
        continue;
      }

      // Handle string - no length prefix, just UTF-8 bytes
      if (type === "string") {
        const str = value as string;
        parts.push(new TextEncoder().encode(str));
        continue;
      }

      throw new AbiEncodingError(`Unsupported type for encodePacked: ${type}`);
    }

    // Concatenate all parts
    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }

    return result;
  }

  /**
   * Format ABI item to human-readable string
   *
   * @example "function transfer(address to, uint256 amount) returns (bool)"
   */
  export function formatAbiItem(item: Item): string {
    if (!("name" in item)) {
      return item.type;
    }

    const inputs =
      "inputs" in item
        ? item.inputs.map((p) => `${p.type}${p.name ? ` ${p.name}` : ""}`).join(", ")
        : "";

    let result = `${item.type} ${item.name}(${inputs})`;

    if (item.type === "function" && item.outputs.length > 0) {
      const outputs = item.outputs.map((p) => p.type).join(", ");
      result += ` returns (${outputs})`;
    }

    if ("stateMutability" in item && item.stateMutability !== "nonpayable") {
      result += ` ${item.stateMutability}`;
    }

    return result;
  }

  /**
   * Format ABI item with argument values
   *
   * @example "transfer(0x742d...f251e, 1000000000000000000)"
   */
  export function formatAbiItemWithArgs(item: Item, args: readonly unknown[]): string {
    if (!("name" in item) || !("inputs" in item)) {
      return formatAbiItem(item);
    }

    const formattedArgs = args
      .map((arg, i) => {
        void item.inputs[i];
        // TODO: Format based on type (addresses with checksum, bigints as strings, etc.)
        return String(arg);
      })
      .join(", ");

    return `${item.name}(${formattedArgs})`;
  }

  /**
   * Get function selector from signature string
   *
   * @param signature - Function signature (e.g., "transfer(address,uint256)")
   * @returns 4-byte selector
   *
   * @example
   * ```typescript
   * const selector = Abi.getFunctionSelector("transfer(address,uint256)");
   * // Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
   * ```
   */
  export function getFunctionSelector(signature: string): Uint8Array {
    const hash = Hash.keccak256String(signature);
    return hash.slice(0, 4);
  }

  /**
   * Get event selector from signature string
   *
   * @param signature - Event signature (e.g., "Transfer(address,address,uint256)")
   * @returns 32-byte selector (topic0)
   *
   * @example
   * ```typescript
   * const selector = Abi.getEventSelector("Transfer(address,address,uint256)");
   * // 32-byte Hash
   * ```
   */
  export function getEventSelector(signature: string): Hash {
    return Hash.keccak256String(signature);
  }

  /**
   * Get error selector from signature string
   *
   * @param signature - Error signature (e.g., "InsufficientBalance(uint256,uint256)")
   * @returns 4-byte selector
   *
   * @example
   * ```typescript
   * const selector = Abi.getErrorSelector("InsufficientBalance(uint256,uint256)");
   * // Uint8Array([...])
   * ```
   */
  export function getErrorSelector(signature: string): Uint8Array {
    const hash = Hash.keccak256String(signature);
    return hash.slice(0, 4);
  }
}

/**
 * Complete ABI (array of items)
 *
 * Uses TypeScript declaration merging - Abi is both a namespace and a type.
 */
export type Abi = readonly Abi.Item[];

// Re-export namespace as default
export default Abi;

/**
 * ABI Encoding and Decoding
 *
 * Low-level ABI encoding/decoding functions following Ethereum's ABI specification.
 * Handles parameter encoding/decoding for functions, events, errors, and constructors.
 */

import type * as Abi from "./types.js";
import {
  AbiEncodingError,
  AbiDecodingError,
  AbiParameterMismatchError,
} from "./errors.js";
import { Uint } from "../uint.js";
import { Address } from "../address.js";

// ============================================================================
// Internal Encoding Helpers
// ============================================================================

/**
 * Encode a uint256 value to 32 bytes (left-padded)
 * @internal
 */
function encodeUint256(value: bigint): Uint8Array {
  return Uint.toAbiEncoded.call(Uint.from(value));
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
function isDynamicType(type: Abi.AbiType): boolean {
  if (type === "string" || type === "bytes") return true;
  if (type.endsWith("[]")) return true;
  // Fixed-size arrays like uint256[3] are static if the element type is static
  if (type.includes("[") && type.endsWith("]")) {
    const match = type.match(/^(.+)\[(\d+)\]$/);
    if (match && match[1]) {
      const elementType = match[1] as Abi.AbiType;
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
  type: Abi.AbiType,
  value: unknown,
): { encoded: Uint8Array; isDynamic: boolean } {
  // Handle dynamic arrays first (before checking for uint)
  if (type.endsWith("[]")) {
    const elementType = type.slice(0, -2) as Abi.AbiType;
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
    const addr = value as Address | string;
    // If it's a string, convert to Address first
    if (typeof addr === "string") {
      const addressValue = Address.fromHex(addr);
      return { encoded: Address.toAbiEncoded.call(addressValue), isDynamic: false };
    }
    // If it's already an Address, encode directly
    return { encoded: Address.toAbiEncoded.call(addr), isDynamic: false };
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
    const elementType = fixedArrayMatch[1] as Abi.AbiType;
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

// ============================================================================
// Internal Decoding Helpers
// ============================================================================

/**
 * Decode a uint256 value from 32 bytes
 * @internal
 */
function decodeUint256(data: Uint8Array, offset: number): bigint {
  if (offset + 32 > data.length) {
    throw new AbiDecodingError("Data too small for uint256");
  }
  const slice = data.slice(offset, offset + 32);
  return Uint.toBigInt.call(Uint.fromAbiEncoded(slice));
}

/**
 * Decode a single value based on its type
 * @internal
 */
function decodeValue(
  type: Abi.AbiType,
  data: Uint8Array,
  offset: number,
): { value: unknown; newOffset: number } {
  // Handle arrays first (before uint/int checks, since "uint256[]" starts with "uint")
  // Handle dynamic arrays
  if (type.endsWith("[]")) {
    const elementType = type.slice(0, -2) as Abi.AbiType;
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
    const elementType = fixedArrayMatch[1] as Abi.AbiType;
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
    const slice = data.slice(offset, offset + 32);
    const addr = Address.fromAbiEncoded(slice);
    const hex = Address.toHex.call(addr);
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

// ============================================================================
// Public Encoding/Decoding Functions
// ============================================================================

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
 * const encoded = encodeParameters(params, [address, amount]);
 * ```
 */
export function encodeParameters<const TParams extends readonly Abi.Parameter[]>(
  params: TParams,
  values: Abi.ParametersToPrimitiveTypes<TParams>,
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
 * const values = decodeParameters(params, data);
 * ```
 */
export function decodeParameters<const TParams extends readonly Abi.Parameter[]>(
  params: TParams,
  data: Uint8Array,
): Abi.ParametersToPrimitiveTypes<TParams> {
  const result: unknown[] = [];
  let offset = 0;

  for (const param of params) {
    const { value } = decodeValue(param.type, data, offset);
    result.push(value);
    offset += 32; // Each parameter takes 32 bytes in static section
  }

  return result as Abi.ParametersToPrimitiveTypes<TParams>;
}

// Re-export for internal use by other modules
export { encodeUint256, encodeUint, encodeInt, encodeValue, decodeUint256, decodeValue, isDynamicType, padRight };

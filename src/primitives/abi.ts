/**
 * ABI (Application Binary Interface) encoding module
 *
 * Implements Ethereum's ABI encoding/decoding for function calls, events,
 * and contract interaction.
 */

import { keccak_256 } from '@noble/hashes/sha3.js';

/**
 * ABI Error types
 */
export class AbiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AbiError';
  }
}

/**
 * ABI types enum
 */
export enum AbiType {
  Uint8 = 'uint8',
  Uint16 = 'uint16',
  Uint32 = 'uint32',
  Uint64 = 'uint64',
  Uint128 = 'uint128',
  Uint256 = 'uint256',
  Int8 = 'int8',
  Int16 = 'int16',
  Int32 = 'int32',
  Int64 = 'int64',
  Int128 = 'int128',
  Int256 = 'int256',
  Address = 'address',
  Bool = 'bool',
  Bytes1 = 'bytes1',
  Bytes2 = 'bytes2',
  Bytes3 = 'bytes3',
  Bytes4 = 'bytes4',
  Bytes8 = 'bytes8',
  Bytes16 = 'bytes16',
  Bytes32 = 'bytes32',
  Bytes = 'bytes',
  String = 'string',
  Uint256Array = 'uint256[]',
  Bytes32Array = 'bytes32[]',
  AddressArray = 'address[]',
  StringArray = 'string[]',
}

/**
 * ABI value types
 */
export type AbiValue =
  | number
  | bigint
  | string
  | boolean
  | Uint8Array
  | AbiValue[];

/**
 * Function selector (4 bytes)
 */
export type Selector = Uint8Array;

/**
 * State mutability types
 */
export enum StateMutability {
  Pure = 'pure',
  View = 'view',
  Nonpayable = 'nonpayable',
  Payable = 'payable',
}

/**
 * Function definition
 */
export interface FunctionDefinition {
  name: string;
  inputs: AbiParameter[];
  outputs?: AbiParameter[];
  stateMutability?: StateMutability;
}

/**
 * ABI parameter definition
 */
export interface AbiParameter {
  name?: string;
  type: AbiType | string;
  indexed?: boolean;
}

/**
 * Internal: Check if type is dynamic
 */
function isDynamicType(type: string): boolean {
  return type === AbiType.Bytes || type === AbiType.String || type.endsWith('[]');
}

/**
 * Internal: Encode single value
 */
function encodeValue(type: string, value: AbiValue): Uint8Array {
  // Handle arrays FIRST (before checking type prefix)
  if (type.endsWith('[]')) {
    const array = value as AbiValue[];
    const elementType = type.slice(0, -2);
    const length = encodeBigInt(BigInt(array.length));
    const encodedElements = array.map(v => encodeValue(elementType, v));
    const totalLength = length.length + encodedElements.reduce((sum, e) => sum + e.length, 0);
    const result = new Uint8Array(totalLength);
    result.set(length, 0);
    let offset = length.length;
    for (const encoded of encodedElements) {
      result.set(encoded, offset);
      offset += encoded.length;
    }
    return result;
  }

  // Handle numeric types
  if (type.startsWith('uint') || type.startsWith('int')) {
    let num: bigint;
    if (typeof value === 'bigint') {
      num = value;
    } else if (typeof value === 'number') {
      num = BigInt(value);
    } else {
      num = BigInt(value as number);
    }
    return encodeBigInt(num);
  }

  // Handle bool
  if (type === AbiType.Bool) {
    return encodeBigInt(value ? 1n : 0n);
  }

  // Handle address
  if (type === AbiType.Address) {
    const addr = value as string;
    const bytes = hexToBytes(addr);
    return padLeft(bytes);
  }

  // Handle fixed bytes (bytes1-bytes32)
  if (type.startsWith('bytes') && type.length <= 7) {
    const bytes = value as Uint8Array;
    const padded = new Uint8Array(32);
    padded.set(bytes, 0);
    return padded;
  }

  // Handle dynamic bytes
  if (type === AbiType.Bytes) {
    const bytes = value as Uint8Array;
    const length = encodeBigInt(BigInt(bytes.length));
    const data = padRight(bytes);
    const result = new Uint8Array(length.length + data.length);
    result.set(length, 0);
    result.set(data, length.length);
    return result;
  }

  // Handle string
  if (type === AbiType.String) {
    const str = value as string;
    const bytes = new TextEncoder().encode(str);
    const length = encodeBigInt(BigInt(bytes.length));
    const data = padRight(bytes);
    const result = new Uint8Array(length.length + data.length);
    result.set(length, 0);
    result.set(data, length.length);
    return result;
  }

  throw new AbiError(`Unsupported type: ${type}`);
}

/**
 * Encode ABI parameters
 *
 * @param params - Parameter definitions
 * @param values - Values to encode
 * @returns ABI-encoded bytes
 */
export function encodeAbiParameters(
  params: AbiParameter[],
  values: AbiValue[]
): Uint8Array {
  if (params.length !== values.length) {
    throw new AbiError('Parameter count mismatch');
  }

  if (params.length === 0) {
    return new Uint8Array(0);
  }

  // Separate static and dynamic parts
  const staticParts: Uint8Array[] = [];
  const dynamicParts: Uint8Array[] = [];

  for (let i = 0; i < params.length; i++) {
    const type = params[i].type as string;
    const value = values[i];

    if (isDynamicType(type)) {
      // Dynamic type: encode offset placeholder
      staticParts.push(new Uint8Array(32)); // Will be filled later
      dynamicParts.push(encodeValue(type, value));
    } else {
      // Static type: encode directly
      staticParts.push(encodeValue(type, value));
      dynamicParts.push(new Uint8Array(0));
    }
  }

  // Calculate offsets
  const staticLength = staticParts.reduce((sum, part) => sum + part.length, 0);
  let dynamicOffset = staticLength;

  for (let i = 0; i < params.length; i++) {
    const type = params[i].type as string;
    if (isDynamicType(type)) {
      // Update offset placeholder
      staticParts[i] = encodeBigInt(BigInt(dynamicOffset));
      dynamicOffset += dynamicParts[i].length;
    }
  }

  // Concatenate all parts
  const totalLength = staticLength + dynamicParts.reduce((sum, part) => sum + part.length, 0);
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
 * Internal: Decode single value
 */
function decodeValue(type: string, data: Uint8Array, offset: number): [AbiValue, number] {
  // Handle numeric types
  if (type.startsWith('uint') || type.startsWith('int')) {
    return [decodeBigInt(data, offset), offset + 32];
  }

  // Handle bool
  if (type === AbiType.Bool) {
    const value = decodeBigInt(data, offset);
    return [value !== 0n, offset + 32];
  }

  // Handle address
  if (type === AbiType.Address) {
    const bytes = data.slice(offset + 12, offset + 32);
    return [bytesToHex(bytes), offset + 32];
  }

  // Handle fixed bytes
  if (type.startsWith('bytes') && type.length <= 7 && !type.endsWith('[]')) {
    const size = parseInt(type.slice(5));
    const bytes = data.slice(offset, offset + size);
    return [bytes, offset + 32];
  }

  // Handle dynamic bytes
  if (type === AbiType.Bytes) {
    const length = Number(decodeBigInt(data, offset));
    const bytes = data.slice(offset + 32, offset + 32 + length);
    return [bytes, offset + 32 + Math.ceil(length / 32) * 32];
  }

  // Handle string
  if (type === AbiType.String) {
    const length = Number(decodeBigInt(data, offset));
    const bytes = data.slice(offset + 32, offset + 32 + length);
    return [new TextDecoder().decode(bytes), offset + 32 + Math.ceil(length / 32) * 32];
  }

  // Handle arrays
  if (type.endsWith('[]')) {
    const elementType = type.slice(0, -2);
    const length = Number(decodeBigInt(data, offset));
    const array: AbiValue[] = [];
    let currentOffset = offset + 32;
    for (let i = 0; i < length; i++) {
      const [value, newOffset] = decodeValue(elementType, data, currentOffset);
      array.push(value);
      currentOffset = newOffset;
    }
    return [array, currentOffset];
  }

  throw new AbiError(`Unsupported type: ${type}`);
}

/**
 * Decode ABI parameters
 *
 * @param params - Parameter definitions
 * @param data - ABI-encoded bytes
 * @returns Decoded values
 */
export function decodeAbiParameters(
  params: AbiParameter[],
  data: Uint8Array
): AbiValue[] {
  const result: AbiValue[] = [];
  let offset = 0;

  for (const param of params) {
    const type = param.type as string;

    if (isDynamicType(type)) {
      // Dynamic type: read offset, then decode from that position
      const dynamicOffset = Number(decodeBigInt(data, offset));
      const [value] = decodeValue(type, data, dynamicOffset);
      result.push(value);
      offset += 32;
    } else {
      // Static type: decode directly
      const [value, newOffset] = decodeValue(type, data, offset);
      result.push(value);
      offset = newOffset;
    }
  }

  return result;
}

/**
 * Compute function selector from signature
 *
 * @param signature - Function signature (e.g., "transfer(address,uint256)")
 * @returns 4-byte selector
 */
export function computeSelector(signature: string): Selector {
  const bytes = new TextEncoder().encode(signature);
  const hash = keccak256(bytes);
  return hash.slice(0, 4);
}

/**
 * Create function signature from definition
 *
 * @param definition - Function definition
 * @returns Function signature string
 */
export function createFunctionSignature(definition: FunctionDefinition): string {
  const types = definition.inputs.map(input => input.type).join(',');
  return `${definition.name}(${types})`;
}

/**
 * Encode function call data
 *
 * @param definition - Function definition
 * @param args - Function arguments
 * @returns Encoded function call (selector + encoded args)
 */
export function encodeFunctionData(
  definition: FunctionDefinition,
  args: AbiValue[]
): Uint8Array {
  const signature = createFunctionSignature(definition);
  const selector = computeSelector(signature);
  const encodedArgs = encodeAbiParameters(definition.inputs, args);
  const result = new Uint8Array(selector.length + encodedArgs.length);
  result.set(selector, 0);
  result.set(encodedArgs, selector.length);
  return result;
}

/**
 * Decode function call data
 *
 * @param definition - Function definition
 * @param data - Encoded function call
 * @returns Decoded function arguments
 */
export function decodeFunctionData(
  definition: FunctionDefinition,
  data: Uint8Array
): AbiValue[] {
  // Skip selector (first 4 bytes)
  const encodedArgs = data.slice(4);
  return decodeAbiParameters(definition.inputs, encodedArgs);
}

/**
 * Encode event topics
 *
 * @param definition - Function definition (used for events)
 * @param values - Indexed parameter values
 * @returns Array of topic hashes
 */
export function encodeEventTopics(
  definition: FunctionDefinition,
  values: AbiValue[]
): Uint8Array[] {
  const signature = createFunctionSignature(definition);
  const signatureHash = keccak256(new TextEncoder().encode(signature));

  const topics: Uint8Array[] = [signatureHash];

  // Add indexed parameters
  const indexedParams = definition.inputs.filter(p => p.indexed);
  for (let i = 0; i < Math.min(indexedParams.length, values.length); i++) {
    const type = indexedParams[i].type as string;
    const value = values[i];
    const encoded = encodeValue(type, value);
    // For indexed parameters, we hash dynamic types
    if (isDynamicType(type)) {
      topics.push(keccak256(encoded));
    } else {
      topics.push(encoded);
    }
  }

  return topics;
}

/**
 * Encode packed (non-standard, no padding)
 *
 * @param params - Parameter definitions
 * @param values - Values to encode
 * @returns Packed encoded bytes
 */
export function encodePacked(
  params: AbiParameter[],
  values: AbiValue[]
): Uint8Array {
  const parts: Uint8Array[] = [];

  for (let i = 0; i < params.length; i++) {
    const type = params[i].type as string;
    const value = values[i];

    if (type.startsWith('uint') || type.startsWith('int')) {
      // Extract size from type (e.g., uint256 -> 256, uint8 -> 8)
      const sizeMatch = type.match(/\d+/);
      const bitSize = sizeMatch ? parseInt(sizeMatch[0]) : 256;
      const byteSize = bitSize / 8;
      const num = typeof value === 'bigint' ? value : BigInt(value as number);

      // Encode as minimal bytes
      const bytes = new Uint8Array(byteSize);
      let v = num;
      for (let j = byteSize - 1; j >= 0; j--) {
        bytes[j] = Number(v & 0xffn);
        v = v >> 8n;
      }
      parts.push(bytes);
    } else if (type === AbiType.Address) {
      const addr = value as string;
      parts.push(hexToBytes(addr));
    } else if (type === AbiType.Bool) {
      parts.push(new Uint8Array([value ? 1 : 0]));
    } else if (type === AbiType.String) {
      const str = value as string;
      parts.push(new TextEncoder().encode(str));
    } else if (type === AbiType.Bytes) {
      parts.push(value as Uint8Array);
    } else if (type.startsWith('bytes') && !type.endsWith('[]')) {
      parts.push(value as Uint8Array);
    }
  }

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
 * Estimate gas for calldata
 *
 * @param data - Calldata bytes
 * @returns Estimated gas cost
 */
export function estimateGasForData(data: Uint8Array): number {
  let gas = 0;
  for (const byte of data) {
    if (byte === 0) {
      gas += 4; // Zero byte cost
    } else {
      gas += 16; // Non-zero byte cost
    }
  }
  return gas;
}

/**
 * Internal: Keccak256 hash function
 */
function keccak256(data: Uint8Array): Uint8Array {
  return keccak_256(data);
}

/**
 * Internal: Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Internal: Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Internal: Pad bytes to 32 bytes (left-pad for numbers)
 */
function padLeft(bytes: Uint8Array): Uint8Array {
  if (bytes.length >= 32) return bytes.slice(-32);
  const padded = new Uint8Array(32);
  padded.set(bytes, 32 - bytes.length);
  return padded;
}

/**
 * Internal: Pad bytes to 32 bytes (right-pad for strings/bytes)
 */
function padRight(bytes: Uint8Array): Uint8Array {
  if (bytes.length >= 32) return bytes;
  const padded = new Uint8Array(Math.ceil(bytes.length / 32) * 32);
  padded.set(bytes, 0);
  return padded;
}

/**
 * Internal: Encode a bigint as 32-byte word
 */
function encodeBigInt(value: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let v = value;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(v & 0xffn);
    v = v >> 8n;
  }
  return bytes;
}

/**
 * Internal: Decode 32-byte word as bigint
 */
function decodeBigInt(bytes: Uint8Array, offset: number = 0): bigint {
  let value = 0n;
  for (let i = 0; i < 32; i++) {
    value = (value << 8n) | BigInt(bytes[offset + i]);
  }
  return value;
}

/**
 * Helper: Create uint256 value
 */
export function uint256Value(value: number | bigint | string): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') {
    if (value.startsWith('0x')) {
      return BigInt(value);
    }
    return BigInt(value);
  }
  throw new AbiError('Invalid uint256 value');
}

/**
 * Helper: Create bool value
 */
export function boolValue(value: boolean): boolean {
  return value;
}

/**
 * Helper: Create address value
 */
export function addressValue(value: string): string {
  if (!value.startsWith('0x')) {
    value = '0x' + value;
  }
  if (value.length !== 42) {
    throw new AbiError('Invalid address length');
  }
  return value.toLowerCase();
}

/**
 * Helper: Create string value
 */
export function stringValue(value: string): string {
  return value;
}

/**
 * Helper: Create bytes value
 */
export function bytesValue(value: Uint8Array | string): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }
  return hexToBytes(value);
}

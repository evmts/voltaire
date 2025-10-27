/**
 * RLP (Recursive Length Prefix) - Ethereum's serialization format
 *
 * This module provides RLP encoding and decoding as specified in the Ethereum Yellow Paper.
 * RLP is used throughout Ethereum for serializing transactions, blocks, state, and other data structures.
 *
 * ## RLP Specification Overview
 *
 * RLP is a serialization method that encodes arbitrarily nested arrays of binary data.
 *
 * ### String Encoding
 * - **Single byte [0x00, 0x7f]**: Encoded as itself
 * - **String [0-55 bytes]**: 0x80 + length, followed by string
 * - **Long string [55+ bytes]**: 0xb7 + length_of_length + length + string
 *
 * ### List Encoding
 * - **Short list [0-55 bytes]**: 0xc0 + length, followed by items
 * - **Long list [55+ bytes]**: 0xf7 + length_of_length + length + items
 *
 * ## Error Types
 * - `InputTooShort`: Unexpected end of input
 * - `InputTooLong`: Data exceeds expected length
 * - `LeadingZeros`: Invalid number encoding
 * - `NonCanonicalSize`: Non-minimal length encoding
 * - `InvalidLength`: Malformed length field
 * - `UnexpectedInput`: Invalid data format
 * - `InvalidRemainder`: Extra data in non-stream mode
 * - `ExtraZeros`: Extra leading zeros
 * - `RecursionDepthExceeded`: Too deeply nested
 */

/**
 * Maximum recursion depth to prevent stack overflow attacks
 */
export const MAX_RLP_DEPTH = 32;

/**
 * RLP error types
 */
export type RlpErrorType =
  | 'InputTooShort'
  | 'InputTooLong'
  | 'LeadingZeros'
  | 'NonCanonicalSize'
  | 'InvalidLength'
  | 'UnexpectedInput'
  | 'InvalidRemainder'
  | 'ExtraZeros'
  | 'RecursionDepthExceeded';

export class RlpError extends Error {
  constructor(
    public readonly type: RlpErrorType,
    message?: string
  ) {
    super(message || type);
    this.name = 'RlpError';
  }
}

/**
 * RLP data type - discriminated union of bytes or list
 */
export type RlpData =
  | { type: 'bytes'; value: Uint8Array }
  | { type: 'list'; value: RlpData[] };

/**
 * Decoded RLP data with remainder (for stream decoding)
 */
export interface RlpDecoded {
  data: RlpData;
  remainder: Uint8Array;
}

/**
 * Types that can be encoded to RLP
 * - Uint8Array (bytes)
 * - RlpData (already structured)
 * - Array of RlpEncodable (list)
 */
export type RlpEncodable = Uint8Array | RlpData | RlpEncodable[];

/**
 * RLP encoding and decoding utilities
 */
export namespace Rlp {
  /**
   * Encodes data to RLP format
   *
   * @param data - Data to encode (Uint8Array, RlpData, or array)
   * @returns RLP-encoded bytes
   *
   * Rules:
   * - Single byte < 0x80: encoded as itself
   * - Byte array 0-55 bytes: [0x80 + length, ...bytes]
   * - Byte array > 55 bytes: [0xb7 + length_of_length, ...length_bytes, ...bytes]
   * - List 0-55 bytes total: [0xc0 + length, ...encoded_items]
   * - List > 55 bytes total: [0xf7 + length_of_length, ...length_bytes, ...encoded_items]
   */
  export const encode = (data: RlpEncodable): Uint8Array => {
    // TODO: Implement RLP encoding
    // 1. Check if data is Uint8Array -> call encodeBytes
    // 2. Check if data is RlpData
    //    - If type is 'bytes' -> call encodeBytes
    //    - If type is 'list' -> recursively encode items and call encodeList
    // 3. Check if data is array -> recursively encode each item and call encodeList
    throw new Error('Not implemented');
  };

  /**
   * Decodes RLP-encoded bytes
   *
   * @param bytes - RLP-encoded data
   * @param stream - If true, allows extra data after decoded value. If false, expects exact match
   * @returns Decoded RLP data with remainder
   *
   * Rules:
   * - Prefix 0x00-0x7f: single byte, value is the byte itself
   * - Prefix 0x80-0xb7: string of length (prefix - 0x80)
   * - Prefix 0xb8-0xbf: long string, length encoded in next (prefix - 0xb7) bytes
   * - Prefix 0xc0-0xf7: list of total length (prefix - 0xc0)
   * - Prefix 0xf8-0xff: long list, length encoded in next (prefix - 0xf7) bytes
   *
   * Validation:
   * - Check for leading zeros in length encoding
   * - Enforce canonical representation (no unnecessary long form)
   * - Prevent recursion depth > MAX_RLP_DEPTH
   * - In non-stream mode, verify no remainder after decoding
   */
  export const decode = (bytes: Uint8Array, stream = false): RlpDecoded => {
    // TODO: Implement RLP decoding
    // 1. Handle empty input
    // 2. Call internal _decode with depth tracking (initial depth = 0)
    // 3. If !stream and remainder.length > 0, throw InvalidRemainder error
    // 4. Return decoded data with remainder
    throw new Error('Not implemented');
  };

  /**
   * Encodes a byte array according to RLP string rules
   *
   * @param bytes - Byte array to encode
   * @returns RLP-encoded bytes
   *
   * Rules:
   * - Single byte < 0x80: return as-is (no prefix)
   * - 0-55 bytes: [0x80 + length, ...bytes]
   * - > 55 bytes: [0xb7 + length_of_length, ...length_bytes, ...bytes]
   */
  export const encodeBytes = (bytes: Uint8Array): Uint8Array => {
    // TODO: Implement byte encoding
    // 1. If length == 1 and bytes[0] < 0x80: return bytes as-is
    // 2. If length < 56: return [0x80 + length, ...bytes]
    // 3. Else (length >= 56):
    //    a. Encode length as big-endian bytes (no leading zeros)
    //    b. Return [0xb7 + length_of_length, ...length_bytes, ...bytes]
    throw new Error('Not implemented');
  };

  /**
   * Encodes a list of RLP-encodable items
   *
   * @param items - Array of items to encode
   * @returns RLP-encoded list
   *
   * Rules:
   * - Each item is first RLP-encoded
   * - Calculate total length of all encoded items
   * - If total < 56: [0xc0 + total_length, ...encoded_items]
   * - If total >= 56: [0xf7 + length_of_length, ...length_bytes, ...encoded_items]
   */
  export const encodeList = (items: RlpEncodable[]): Uint8Array => {
    // TODO: Implement list encoding
    // 1. Encode each item recursively using encode()
    // 2. Calculate total_length = sum of all encoded item lengths
    // 3. If total_length < 56:
    //    a. Return [0xc0 + total_length, ...concat_encoded_items]
    // 4. Else (total_length >= 56):
    //    a. Encode total_length as big-endian bytes (no leading zeros)
    //    b. Return [0xf7 + length_of_length, ...length_bytes, ...concat_encoded_items]
    throw new Error('Not implemented');
  };

  /**
   * Internal decode implementation with depth tracking
   *
   * @param bytes - Input bytes
   * @param depth - Current recursion depth
   * @returns Decoded data with remainder
   */
  const _decode = (bytes: Uint8Array, depth: number): RlpDecoded => {
    // TODO: Implement internal decode with depth tracking
    // 1. Check depth >= MAX_RLP_DEPTH -> throw RecursionDepthExceeded
    // 2. Check bytes.length == 0 -> throw InputTooShort
    // 3. Get prefix = bytes[0]
    // 4. Handle based on prefix range:
    //
    //    a. prefix <= 0x7f (single byte):
    //       - Return { data: { type: 'bytes', value: Uint8Array([prefix]) }, remainder: bytes.slice(1) }
    //
    //    b. prefix <= 0xb7 (short string):
    //       - length = prefix - 0x80
    //       - If prefix == 0x80: return empty bytes
    //       - If length == 1 && bytes[1] < 0x80: throw NonCanonicalSize (should be encoded as single byte)
    //       - Check bytes.length - 1 >= length, else throw InputTooShort
    //       - Return { data: { type: 'bytes', value: bytes.slice(1, 1 + length) }, remainder: bytes.slice(1 + length) }
    //
    //    c. prefix <= 0xbf (long string):
    //       - length_of_length = prefix - 0xb7
    //       - Check bytes[1] != 0, else throw LeadingZeros
    //       - Decode length from bytes[1..1+length_of_length] as big-endian
    //       - Check length >= 56, else throw NonCanonicalSize (should use short form)
    //       - Check bytes.length - 1 - length_of_length >= length, else throw InputTooShort
    //       - Return { data: { type: 'bytes', value: bytes.slice(1 + length_of_length, 1 + length_of_length + length) }, remainder: ... }
    //
    //    d. prefix <= 0xf7 (short list):
    //       - length = prefix - 0xc0
    //       - If prefix == 0xc0: return empty list
    //       - Decode items from bytes[1..1+length] by recursively calling _decode with depth+1
    //       - Return { data: { type: 'list', value: items }, remainder: bytes.slice(1 + length) }
    //
    //    e. prefix <= 0xff (long list):
    //       - length_of_length = prefix - 0xf7
    //       - Check bytes[1] != 0, else throw LeadingZeros
    //       - Decode length from bytes[1..1+length_of_length] as big-endian
    //       - Check length >= 56, else throw NonCanonicalSize (should use short form)
    //       - Decode items from bytes[1+length_of_length..1+length_of_length+length] recursively
    //       - Return { data: { type: 'list', value: items }, remainder: ... }
    //
    //    f. else: throw UnexpectedInput
    throw new Error('Not implemented');
  };

  /**
   * Encodes a length value as big-endian bytes (no leading zeros)
   *
   * @param length - Length value to encode
   * @returns Big-endian byte representation
   */
  const encodeLength = (length: number): Uint8Array => {
    // TODO: Implement length encoding
    // 1. Convert length to big-endian bytes
    // 2. Remove leading zero bytes
    // 3. Return minimal byte representation
    throw new Error('Not implemented');
  };
}

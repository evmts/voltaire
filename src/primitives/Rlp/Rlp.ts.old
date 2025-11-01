/**
 * RLP (Recursive Length Prefix) - Ethereum's serialization format
 *
 * Complete RLP encoding/decoding with strict validation matching Ethereum's spec.
 * All functions use the "this:" pattern where data is operated on.
 *
 * @example
 * ```typescript
 * import * as Rlp from './rlp.js';
 *
 * // Encode data
 * const list = [new Uint8Array([1, 2, 3])];
 * const encoded = Rlp.encode.call(list);
 *
 * // Decode data
 * const bytes = new Uint8Array([0x83, 0x01, 0x02, 0x03]);
 * const decoded = Rlp.decode.call(bytes);
 * ```
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum recursion depth to prevent stack overflow attacks
 */
export const MAX_DEPTH = 32;

// ============================================================================
// Error Types
// ============================================================================

export type ErrorType =
  | "InputTooShort"
  | "InputTooLong"
  | "LeadingZeros"
  | "NonCanonicalSize"
  | "InvalidLength"
  | "UnexpectedInput"
  | "InvalidRemainder"
  | "ExtraZeros"
  | "RecursionDepthExceeded";

export class Error extends globalThis.Error {
  constructor(
    public readonly type: ErrorType,
    message?: string,
  ) {
    super(message || type);
    this.name = "RlpError";
  }
}

// ============================================================================
// Core Types
// ============================================================================

/**
 * RLP data type - discriminated union of bytes or list
 */
export type Data =
  | { type: "bytes"; value: Uint8Array }
  | { type: "list"; value: Data[] };

/**
 * Decoded RLP data with remainder (for stream decoding)
 */
export type Decoded = {
  data: Data;
  remainder: Uint8Array;
};

/**
 * Types that can be encoded to RLP
 * - Uint8Array (bytes)
 * - Data (already structured)
 * - Array of Encodable (list)
 */
export type Encodable = Uint8Array | Data | Encodable[];

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if value is RLP Data structure
 */
export function isData(value: unknown): value is Data {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "value" in value &&
    (value.type === "bytes" || value.type === "list")
  );
}

/**
 * Check if value is bytes Data
 */
export function isBytesData(value: unknown): value is Data & { type: "bytes" } {
  return isData(value) && value.type === "bytes";
}

/**
 * Check if value is list Data
 */
export function isListData(value: unknown): value is Data & { type: "list" } {
  return isData(value) && value.type === "list";
}

// ============================================================================
// Encoding Operations
// ============================================================================

/**
 * Encodes data to RLP format (this: pattern)
 *
 * @param this - Data to encode (Uint8Array, RlpData, or array)
 * @returns RLP-encoded bytes
 *
 * @example
 * ```typescript
 * // Encode bytes
 * const bytes = new Uint8Array([1, 2, 3]);
 * const encoded = Rlp.encode.call(bytes);
 *
 * // Encode list
 * const list = [new Uint8Array([1, 2]), new Uint8Array([3, 4])];
 * const encoded = Rlp.encode.call(list);
 *
 * // Encode nested structures
 * const nested = [new Uint8Array([1]), [new Uint8Array([2]), new Uint8Array([3])]];
 * const encoded = Rlp.encode.call(nested);
 * ```
 *
 * Rules:
 * - Single byte < 0x80: encoded as itself
 * - Byte array 0-55 bytes: [0x80 + length, ...bytes]
 * - Byte array > 55 bytes: [0xb7 + length_of_length, ...length_bytes, ...bytes]
 * - List 0-55 bytes total: [0xc0 + length, ...encoded_items]
 * - List > 55 bytes total: [0xf7 + length_of_length, ...length_bytes, ...encoded_items]
 */
export function encode(this: Encodable): Uint8Array {
  // Handle Uint8Array
  if (this instanceof Uint8Array) {
    return encodeBytes.call(this);
  }

  // Handle Data structure
  if (isData(this)) {
    if (this.type === "bytes") {
      return encodeBytes.call(this.value);
    } else {
      return encodeList.call(this.value);
    }
  }

  // Handle array (list)
  if (Array.isArray(this)) {
    return encodeList.call(this);
  }

  throw new Error("UnexpectedInput", "Invalid encodable data type");
}

/**
 * Encodes a byte array according to RLP string rules (this: pattern)
 *
 * @param this - Byte array to encode
 * @returns RLP-encoded bytes
 *
 * @example
 * ```typescript
 * // Single byte < 0x80
 * const b1 = new Uint8Array([0x7f]);
 * const encoded = Rlp.encodeBytes.call(b1);
 * // => Uint8Array([0x7f])
 *
 * // Short string
 * const b2 = new Uint8Array([1, 2, 3]);
 * const encoded = Rlp.encodeBytes.call(b2);
 * // => Uint8Array([0x83, 1, 2, 3])
 *
 * // Long string (> 55 bytes)
 * const longBytes = new Uint8Array(60).fill(0x42);
 * const encoded = Rlp.encodeBytes.call(longBytes);
 * // => Uint8Array([0xb8, 60, ...longBytes])
 * ```
 *
 * Rules:
 * - Single byte < 0x80: return as-is (no prefix)
 * - 0-55 bytes: [0x80 + length, ...bytes]
 * - > 55 bytes: [0xb7 + length_of_length, ...length_bytes, ...bytes]
 */
export function encodeBytes(this: Uint8Array): Uint8Array {
  // Single byte < 0x80: encoded as itself
  if (this.length === 1 && this[0]! < 0x80) {
    return this;
  }

  // Short string (0-55 bytes)
  if (this.length < 56) {
    const result = new Uint8Array(1 + this.length);
    result[0] = 0x80 + this.length;
    result.set(this, 1);
    return result;
  }

  // Long string (56+ bytes)
  const lengthBytes = encodeLengthValue(this.length);
  const result = new Uint8Array(1 + lengthBytes.length + this.length);
  result[0] = 0xb7 + lengthBytes.length;
  result.set(lengthBytes, 1);
  result.set(this, 1 + lengthBytes.length);
  return result;
}

/**
 * Encodes a list of RLP-encodable items (this: pattern)
 *
 * @param this - Array of items to encode
 * @returns RLP-encoded list
 *
 * @example
 * ```typescript
 * // Empty list
 * const empty = [];
 * const encoded = Rlp.encodeList.call(empty);
 * // => Uint8Array([0xc0])
 *
 * // Simple list
 * const list = [new Uint8Array([1]), new Uint8Array([2])];
 * const encoded = Rlp.encodeList.call(list);
 * // => Uint8Array([0xc4, 0x01, 0x02])
 *
 * // Nested list
 * const nested = [new Uint8Array([1]), [new Uint8Array([2])]];
 * const encoded = Rlp.encodeList.call(nested);
 * ```
 *
 * Rules:
 * - Each item is first RLP-encoded
 * - Calculate total length of all encoded items
 * - If total < 56: [0xc0 + total_length, ...encoded_items]
 * - If total >= 56: [0xf7 + length_of_length, ...length_bytes, ...encoded_items]
 */
export function encodeList(this: Encodable[]): Uint8Array {
  // Encode each item
  const encodedItems = this.map((item) => encode.call(item));

  // Calculate total length
  const totalLength = encodedItems.reduce((sum, item) => sum + item.length, 0);

  // Short list (total payload < 56 bytes)
  if (totalLength < 56) {
    const result = new Uint8Array(1 + totalLength);
    result[0] = 0xc0 + totalLength;
    let offset = 1;
    for (const item of encodedItems) {
      result.set(item, offset);
      offset += item.length;
    }
    return result;
  }

  // Long list (total payload >= 56 bytes)
  const lengthBytes = encodeLengthValue(totalLength);
  const result = new Uint8Array(1 + lengthBytes.length + totalLength);
  result[0] = 0xf7 + lengthBytes.length;
  result.set(lengthBytes, 1);
  let offset = 1 + lengthBytes.length;
  for (const item of encodedItems) {
    result.set(item, offset);
    offset += item.length;
  }
  return result;
}

// ============================================================================
// Decoding Operations
// ============================================================================

/**
 * Decodes RLP-encoded bytes (this: pattern)
 *
 * @param this - RLP-encoded data
 * @param stream - If true, allows extra data after decoded value. If false, expects exact match
 * @returns Decoded RLP data with remainder
 *
 * @example
 * ```typescript
 * // Decode single value
 * const bytes = new Uint8Array([0x83, 1, 2, 3]);
 * const result = Rlp.decode.call(bytes);
 * // => { data: { type: 'bytes', value: Uint8Array([1, 2, 3]) }, remainder: Uint8Array([]) }
 *
 * // Stream decoding (multiple values)
 * const stream = new Uint8Array([0x01, 0x02]);
 * const result = Rlp.decode.call(stream, true);
 * // => { data: { type: 'bytes', value: Uint8Array([1]) }, remainder: Uint8Array([2]) }
 *
 * // Decode list
 * const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
 * const result = Rlp.decode.call(list);
 * ```
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
 * - Prevent recursion depth > MAX_DEPTH
 * - In non-stream mode, verify no remainder after decoding
 */
export function decode(this: Uint8Array, stream = false): Decoded {
  if (this.length === 0) {
    throw new Error("InputTooShort", "Cannot decode empty input");
  }

  const decoded = decodeInternal(this, 0);

  if (!stream && decoded.remainder.length > 0) {
    throw new Error(
      "InvalidRemainder",
      `Extra data after decoded value: ${decoded.remainder.length} bytes`,
    );
  }

  return decoded;
}

// ============================================================================
// Internal Helper Functions
// ============================================================================

/**
 * Internal decode implementation with depth tracking
 *
 * @param bytes - Input bytes
 * @param depth - Current recursion depth
 * @returns Decoded data with remainder
 */
function decodeInternal(bytes: Uint8Array, depth: number): Decoded {
  // Check recursion depth
  if (depth >= MAX_DEPTH) {
    throw new Error(
      "RecursionDepthExceeded",
      `Maximum recursion depth ${MAX_DEPTH} exceeded`,
    );
  }

  // Check for empty input
  if (bytes.length === 0) {
    throw new Error("InputTooShort", "Unexpected end of input");
  }

  const prefix = bytes[0]!;

  // Single byte [0x00, 0x7f]
  if (prefix <= 0x7f) {
    return {
      data: { type: "bytes", value: new Uint8Array([prefix]) },
      remainder: bytes.slice(1),
    };
  }

  // Short string [0x80, 0xb7]
  if (prefix <= 0xb7) {
    const length = prefix - 0x80;

    // Empty string
    if (length === 0) {
      return {
        data: { type: "bytes", value: new Uint8Array(0) },
        remainder: bytes.slice(1),
      };
    }

    // Check for non-canonical encoding
    if (length === 1 && bytes.length > 1 && bytes[1]! < 0x80) {
      throw new Error(
        "NonCanonicalSize",
        "Single byte < 0x80 should not be prefixed",
      );
    }

    // Check sufficient data
    if (bytes.length < 1 + length) {
      throw new Error(
        "InputTooShort",
        `Expected ${1 + length} bytes, got ${bytes.length}`,
      );
    }

    return {
      data: { type: "bytes", value: bytes.slice(1, 1 + length) },
      remainder: bytes.slice(1 + length),
    };
  }

  // Long string [0xb8, 0xbf]
  if (prefix <= 0xbf) {
    const lengthOfLength = prefix - 0xb7;

    // Check for leading zeros
    if (bytes.length < 2 || bytes[1] === 0) {
      throw new Error("LeadingZeros", "Length encoding has leading zeros");
    }

    // Decode length
    if (bytes.length < 1 + lengthOfLength) {
      throw new Error(
        "InputTooShort",
        `Expected ${1 + lengthOfLength} bytes for length, got ${bytes.length}`,
      );
    }

    const length = decodeLengthValue(bytes.slice(1, 1 + lengthOfLength));

    // Check for non-canonical encoding
    if (length < 56) {
      throw new Error(
        "NonCanonicalSize",
        "String < 56 bytes should use short form",
      );
    }

    // Check sufficient data
    if (bytes.length < 1 + lengthOfLength + length) {
      throw new Error(
        "InputTooShort",
        `Expected ${1 + lengthOfLength + length} bytes, got ${bytes.length}`,
      );
    }

    return {
      data: {
        type: "bytes",
        value: bytes.slice(1 + lengthOfLength, 1 + lengthOfLength + length),
      },
      remainder: bytes.slice(1 + lengthOfLength + length),
    };
  }

  // Short list [0xc0, 0xf7]
  if (prefix <= 0xf7) {
    const length = prefix - 0xc0;

    // Empty list
    if (length === 0) {
      return {
        data: { type: "list", value: [] },
        remainder: bytes.slice(1),
      };
    }

    // Check sufficient data
    if (bytes.length < 1 + length) {
      throw new Error(
        "InputTooShort",
        `Expected ${1 + length} bytes, got ${bytes.length}`,
      );
    }

    // Decode list items
    const items: Data[] = [];
    let offset = 1;
    const end = 1 + length;

    while (offset < end) {
      const itemDecoded = decodeInternal(bytes.slice(offset), depth + 1);
      items.push(itemDecoded.data);
      offset += bytes.slice(offset).length - itemDecoded.remainder.length;
    }

    if (offset !== end) {
      throw new Error("InvalidLength", "List payload length mismatch");
    }

    return {
      data: { type: "list", value: items },
      remainder: bytes.slice(end),
    };
  }

  // Long list [0xf8, 0xff]
  if (prefix <= 0xff) {
    const lengthOfLength = prefix - 0xf7;

    // Check for leading zeros
    if (bytes.length < 2 || bytes[1] === 0) {
      throw new Error("LeadingZeros", "Length encoding has leading zeros");
    }

    // Decode length
    if (bytes.length < 1 + lengthOfLength) {
      throw new Error(
        "InputTooShort",
        `Expected ${1 + lengthOfLength} bytes for length, got ${bytes.length}`,
      );
    }

    const length = decodeLengthValue(bytes.slice(1, 1 + lengthOfLength));

    // Check for non-canonical encoding
    if (length < 56) {
      throw new Error("NonCanonicalSize", "List < 56 bytes should use short form");
    }

    // Check sufficient data
    if (bytes.length < 1 + lengthOfLength + length) {
      throw new Error(
        "InputTooShort",
        `Expected ${1 + lengthOfLength + length} bytes, got ${bytes.length}`,
      );
    }

    // Decode list items
    const items: Data[] = [];
    let offset = 1 + lengthOfLength;
    const end = 1 + lengthOfLength + length;

    while (offset < end) {
      const itemDecoded = decodeInternal(bytes.slice(offset), depth + 1);
      items.push(itemDecoded.data);
      offset += bytes.slice(offset).length - itemDecoded.remainder.length;
    }

    if (offset !== end) {
      throw new Error("InvalidLength", "List payload length mismatch");
    }

    return {
      data: { type: "list", value: items },
      remainder: bytes.slice(end),
    };
  }

  throw new Error("UnexpectedInput", `Invalid RLP prefix: 0x${prefix.toString(16)}`);
}

/**
 * Encodes a length value as big-endian bytes (no leading zeros)
 *
 * @param length - Length value to encode
 * @returns Big-endian byte representation
 */
function encodeLengthValue(length: number): Uint8Array {
  if (length === 0) {
    return new Uint8Array(0);
  }

  // Calculate number of bytes needed
  let temp = length;
  let byteCount = 0;
  while (temp > 0) {
    byteCount++;
    temp = Math.floor(temp / 256);
  }

  // Encode as big-endian
  const result = new Uint8Array(byteCount);
  for (let i = byteCount - 1; i >= 0; i--) {
    result[i] = length & 0xff;
    length = Math.floor(length / 256);
  }

  return result;
}

/**
 * Decodes a big-endian length value
 *
 * @param bytes - Big-endian encoded length
 * @returns Decoded length value
 */
function decodeLengthValue(bytes: Uint8Array): number {
  if (bytes.length === 0) {
    return 0;
  }

  // Check for leading zeros
  if (bytes[0] === 0) {
    throw new Error("LeadingZeros", "Length encoding has leading zeros");
  }

  // Decode big-endian
  let result = 0;
  for (let i = 0; i < bytes.length; i++) {
    result = result * 256 + bytes[i]!;
  }

  return result;
}

// ============================================================================
// Data Operations (operate on RLP Data structures)
// ============================================================================

export namespace Data {
  /**
   * Create bytes Data from Uint8Array (this: pattern)
   *
   * @param this - Byte array
   * @returns RLP bytes Data
   *
   * @example
   * ```typescript
   * const bytes = new Uint8Array([1, 2, 3]);
   * const data = Rlp.Data.fromBytes.call(bytes);
   * // => { type: 'bytes', value: Uint8Array([1, 2, 3]) }
   * ```
   */
  export function fromBytes(this: Uint8Array): Data & { type: "bytes" } {
    return { type: "bytes", value: this };
  }

  /**
   * Create list Data from array (this: pattern)
   *
   * @param this - Array of Data items
   * @returns RLP list Data
   *
   * @example
   * ```typescript
   * const items = [
   *   { type: 'bytes', value: new Uint8Array([1]) },
   *   { type: 'bytes', value: new Uint8Array([2]) }
   * ];
   * const data = Rlp.Data.fromList.call(items);
   * // => { type: 'list', value: [...] }
   * ```
   */
  export function fromList(this: Data[]): Data & { type: "list" } {
    return { type: "list", value: this };
  }

  /**
   * Encode Data to RLP bytes (this: pattern)
   *
   * @param this - RLP Data structure
   * @returns RLP-encoded bytes
   *
   * @example
   * ```typescript
   * const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) };
   * const encoded = Rlp.Data.encode.call(data);
   * ```
   */
  export function encode(this: Data): Uint8Array {
    return encode.call(this);
  }

  /**
   * Convert Data to bytes value (if type is bytes) (this: pattern)
   *
   * @param this - RLP Data structure
   * @returns Bytes value or undefined
   *
   * @example
   * ```typescript
   * const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) };
   * const bytes = Rlp.Data.toBytes.call(data);
   * // => Uint8Array([1, 2, 3])
   * ```
   */
  export function toBytes(this: Data): Uint8Array | undefined {
    return this.type === "bytes" ? this.value : undefined;
  }

  /**
   * Convert Data to list value (if type is list) (this: pattern)
   *
   * @param this - RLP Data structure
   * @returns List value or undefined
   *
   * @example
   * ```typescript
   * const data = { type: 'list', value: [...] };
   * const list = Rlp.Data.toList.call(data);
   * ```
   */
  export function toList(this: Data): Data[] | undefined {
    return this.type === "list" ? this.value : undefined;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the total byte length of RLP-encoded data without actually encoding (this: pattern)
 *
 * @param this - Data to measure
 * @returns Length in bytes after RLP encoding
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array([1, 2, 3]);
 * const length = Rlp.getEncodedLength.call(bytes);
 * // => 4 (0x83 prefix + 3 bytes)
 * ```
 */
export function getEncodedLength(this: Encodable): number {
  // Handle Uint8Array
  if (this instanceof Uint8Array) {
    if (this.length === 1 && this[0]! < 0x80) {
      return 1;
    }
    if (this.length < 56) {
      return 1 + this.length;
    }
    const lengthBytes = encodeLengthValue(this.length);
    return 1 + lengthBytes.length + this.length;
  }

  // Handle Data structure
  if (isData(this)) {
    if (this.type === "bytes") {
      return getEncodedLength.call(this.value);
    } else {
      return getEncodedLength.call(this.value);
    }
  }

  // Handle array (list)
  if (Array.isArray(this)) {
    const totalLength = this.reduce((sum, item) => sum + getEncodedLength.call(item), 0);
    if (totalLength < 56) {
      return 1 + totalLength;
    }
    const lengthBytes = encodeLengthValue(totalLength);
    return 1 + lengthBytes.length + totalLength;
  }

  throw new Error("UnexpectedInput", "Invalid encodable data type");
}

/**
 * Flatten nested list Data into array of bytes Data (depth-first) (this: pattern)
 *
 * @param this - RLP Data to flatten
 * @returns Array of bytes Data
 *
 * @example
 * ```typescript
 * const nested = {
 *   type: 'list',
 *   value: [
 *     { type: 'bytes', value: new Uint8Array([1]) },
 *     {
 *       type: 'list',
 *       value: [{ type: 'bytes', value: new Uint8Array([2]) }]
 *     }
 *   ]
 * };
 * const flat = Rlp.flatten.call(nested);
 * // => [
 * //   { type: 'bytes', value: Uint8Array([1]) },
 * //   { type: 'bytes', value: Uint8Array([2]) }
 * // ]
 * ```
 */
export function flatten(this: Data): Array<Data & { type: "bytes" }> {
  const result: Array<Data & { type: "bytes" }> = [];

  function visit(d: Data) {
    if (d.type === "bytes") {
      result.push(d);
    } else {
      for (const item of d.value) {
        visit(item);
      }
    }
  }

  visit(this);
  return result;
}

/**
 * Check if two RLP Data structures are equal (this: pattern)
 *
 * @param this - First Data
 * @param other - Second Data
 * @returns True if equal
 *
 * @example
 * ```typescript
 * const a = { type: 'bytes', value: new Uint8Array([1, 2]) };
 * const b = { type: 'bytes', value: new Uint8Array([1, 2]) };
 * Rlp.equals.call(a, b); // => true
 * ```
 */
export function equals(this: Data, other: Data): boolean {
  if (this.type !== other.type) {
    return false;
  }

  if (this.type === "bytes" && other.type === "bytes") {
    if (this.value.length !== other.value.length) {
      return false;
    }
    for (let i = 0; i < this.value.length; i++) {
      if (this.value[i] !== other.value[i]) {
        return false;
      }
    }
    return true;
  }

  if (this.type === "list" && other.type === "list") {
    if (this.value.length !== other.value.length) {
      return false;
    }
    for (let i = 0; i < this.value.length; i++) {
      if (!equals.call(this.value[i]!, other.value[i]!)) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Convert RLP Data to human-readable JSON format (this: pattern)
 *
 * @param this - RLP Data
 * @returns JSON-serializable representation
 *
 * @example
 * ```typescript
 * const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) };
 * const json = Rlp.toJSON.call(data);
 * // => { type: 'bytes', value: [1, 2, 3] }
 * ```
 */
export function toJSON(this: Data): unknown {
  if (this.type === "bytes") {
    return {
      type: "bytes",
      value: Array.from(this.value),
    };
  }

  return {
    type: "list",
    value: this.value.map((item) => toJSON.call(item)),
  };
}

/**
 * Convert JSON representation back to RLP Data (this: pattern)
 *
 * @param this - JSON object from toJSON
 * @returns RLP Data
 *
 * @example
 * ```typescript
 * const json = { type: 'bytes', value: [1, 2, 3] };
 * const data = Rlp.fromJSON.call(json);
 * // => { type: 'bytes', value: Uint8Array([1, 2, 3]) }
 * ```
 */
export function fromJSON(this: unknown): Data {
  if (
    typeof this !== "object" ||
    this === null ||
    !("type" in this) ||
    !("value" in this)
  ) {
    throw new Error("UnexpectedInput", "Invalid JSON format");
  }

  if (this.type === "bytes") {
    if (!Array.isArray(this.value)) {
      throw new Error("UnexpectedInput", "Bytes value must be array");
    }
    return {
      type: "bytes",
      value: new Uint8Array(this.value),
    };
  }

  if (this.type === "list") {
    if (!Array.isArray(this.value)) {
      throw new Error("UnexpectedInput", "List value must be array");
    }
    return {
      type: "list",
      value: this.value.map((item) => fromJSON.call(item)),
    };
  }

  throw new Error("UnexpectedInput", `Invalid type: ${this.type}`);
}

// ============================================================================
// Branded Types and Legacy Exports
// ============================================================================

/**
 * RLP Data type alias for convenient importing
 */
export type Rlp = Data;

// Legacy exports for backward compatibility
export const MAX_RLP_DEPTH = MAX_DEPTH;
export type RlpErrorType = ErrorType;
export const RlpError = Error;
export type RlpData = Data;
export type RlpDecoded = Decoded;
export type RlpEncodable = Encodable;

/**
 * RLP (Recursive Length Prefix) encoding utilities
 *
 * RLP is the main encoding method used to serialize objects in Ethereum.
 */

/**
 * Encode a single value to RLP format
 */
export function encodeRlp(input: RlpInput): Uint8Array {
  if (input === null || input === undefined) {
    return new Uint8Array([0x80]); // Empty string
  }

  if (typeof input === "string") {
    return encodeString(input);
  }

  if (typeof input === "bigint" || typeof input === "number") {
    return encodeNumber(BigInt(input));
  }

  if (input instanceof Uint8Array) {
    return encodeBytes(input);
  }

  if (Array.isArray(input)) {
    return encodeList(input);
  }

  throw new Error(`Unsupported RLP input type: ${typeof input}`);
}

/**
 * Encode a string to RLP format
 */
function encodeString(str: string): Uint8Array {
  if (str.startsWith("0x")) {
    return encodeHex(str);
  }
  const bytes = new TextEncoder().encode(str);
  return encodeBytes(bytes);
}

/**
 * Encode hex string to RLP format
 */
function encodeHex(hex: string): Uint8Array {
  let cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;

  // Handle empty hex
  if (cleanHex.length === 0) {
    return new Uint8Array([0x80]);
  }

  // Pad to even length
  if (cleanHex.length % 2 !== 0) {
    cleanHex = "0" + cleanHex;
  }

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }

  return encodeBytes(bytes);
}

/**
 * Encode a number/bigint to RLP format
 */
function encodeNumber(num: bigint): Uint8Array {
  if (num === 0n) {
    return new Uint8Array([0x80]); // Empty string for zero
  }

  // Convert to minimal big-endian bytes
  const hex = num.toString(16);
  const paddedHex = hex.length % 2 === 0 ? hex : "0" + hex;
  const bytes = new Uint8Array(paddedHex.length / 2);

  for (let i = 0; i < paddedHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(paddedHex.slice(i, i + 2), 16);
  }

  return encodeBytes(bytes);
}

/**
 * Encode bytes to RLP format
 */
function encodeBytes(bytes: Uint8Array): Uint8Array {
  // Single byte in range [0x00, 0x7f]
  if (bytes.length === 1 && bytes[0] < 0x80) {
    return bytes;
  }

  // String 0-55 bytes long
  if (bytes.length <= 55) {
    const result = new Uint8Array(1 + bytes.length);
    result[0] = 0x80 + bytes.length;
    result.set(bytes, 1);
    return result;
  }

  // String longer than 55 bytes
  const lengthBytes = encodeLength(bytes.length);
  const result = new Uint8Array(1 + lengthBytes.length + bytes.length);
  result[0] = 0xb7 + lengthBytes.length;
  result.set(lengthBytes, 1);
  result.set(bytes, 1 + lengthBytes.length);
  return result;
}

/**
 * Encode a list to RLP format
 */
function encodeList(list: RlpInput[]): Uint8Array {
  const encodedItems = list.map((item) => encodeRlp(item));
  const totalLength = encodedItems.reduce((sum, item) => sum + item.length, 0);

  // List 0-55 bytes long
  if (totalLength <= 55) {
    const result = new Uint8Array(1 + totalLength);
    result[0] = 0xc0 + totalLength;
    let offset = 1;
    for (const item of encodedItems) {
      result.set(item, offset);
      offset += item.length;
    }
    return result;
  }

  // List longer than 55 bytes
  const lengthBytes = encodeLength(totalLength);
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

/**
 * Encode length as big-endian bytes
 */
function encodeLength(length: number): Uint8Array {
  if (length === 0) {
    return new Uint8Array(0);
  }

  const hex = length.toString(16);
  const paddedHex = hex.length % 2 === 0 ? hex : "0" + hex;
  const bytes = new Uint8Array(paddedHex.length / 2);

  for (let i = 0; i < paddedHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(paddedHex.slice(i, i + 2), 16);
  }

  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function toHex(bytes: Uint8Array): string {
  return "0x" + Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert hex string to Uint8Array
 */
export function fromHex(hex: string): Uint8Array {
  let cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;

  if (cleanHex.length % 2 !== 0) {
    cleanHex = "0" + cleanHex;
  }

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }

  return bytes;
}

/**
 * Decode RLP data
 */
export function decodeRlp(data: Uint8Array): RlpDecoded {
  if (data.length === 0) {
    throw new Error("Cannot decode empty RLP data");
  }

  const prefix = data[0];

  // Single byte
  if (prefix < 0x80) {
    return data[0];
  }

  // String 0-55 bytes
  if (prefix <= 0xb7) {
    const length = prefix - 0x80;
    if (length === 0) {
      return new Uint8Array(0);
    }
    return data.slice(1, 1 + length);
  }

  // String longer than 55 bytes
  if (prefix <= 0xbf) {
    const lengthOfLength = prefix - 0xb7;
    const length = readLength(data.slice(1, 1 + lengthOfLength));
    return data.slice(1 + lengthOfLength, 1 + lengthOfLength + length);
  }

  // List 0-55 bytes
  if (prefix <= 0xf7) {
    const length = prefix - 0xc0;
    if (length === 0) {
      return [];
    }
    return decodeList(data.slice(1, 1 + length));
  }

  // List longer than 55 bytes
  const lengthOfLength = prefix - 0xf7;
  const length = readLength(data.slice(1, 1 + lengthOfLength));
  return decodeList(data.slice(1 + lengthOfLength, 1 + lengthOfLength + length));
}

/**
 * Decode list items
 */
function decodeList(data: Uint8Array): RlpDecoded[] {
  const items: RlpDecoded[] = [];
  let offset = 0;

  while (offset < data.length) {
    const prefix = data[offset];
    let itemLength: number;

    if (prefix < 0x80) {
      itemLength = 1;
    } else if (prefix <= 0xb7) {
      itemLength = 1 + (prefix - 0x80);
    } else if (prefix <= 0xbf) {
      const lengthOfLength = prefix - 0xb7;
      const length = readLength(data.slice(offset + 1, offset + 1 + lengthOfLength));
      itemLength = 1 + lengthOfLength + length;
    } else if (prefix <= 0xf7) {
      itemLength = 1 + (prefix - 0xc0);
    } else {
      const lengthOfLength = prefix - 0xf7;
      const length = readLength(data.slice(offset + 1, offset + 1 + lengthOfLength));
      itemLength = 1 + lengthOfLength + length;
    }

    items.push(decodeRlp(data.slice(offset, offset + itemLength)));
    offset += itemLength;
  }

  return items;
}

/**
 * Read length from bytes
 */
function readLength(bytes: Uint8Array): number {
  let length = 0;
  for (let i = 0; i < bytes.length; i++) {
    length = (length << 8) + bytes[i];
  }
  return length;
}

// Type definitions
export type RlpInput = string | number | bigint | Uint8Array | RlpInput[] | null | undefined;
export type RlpDecoded = number | Uint8Array | RlpDecoded[];

/**
 * RLP (Recursive Length Prefix) encoding module
 *
 * Implements Ethereum's RLP serialization format for encoding and decoding
 * arbitrarily nested arrays of binary data.
 */

/**
 * RLP Error types matching the Zig implementation
 */
export class RlpError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RlpError";
	}
}

export class InputTooShort extends RlpError {
	constructor() {
		super("RLP input data too short");
		this.name = "InputTooShort";
	}
}

export class InputTooLong extends RlpError {
	constructor() {
		super("RLP input data too long");
		this.name = "InputTooLong";
	}
}

export class LeadingZeros extends RlpError {
	constructor() {
		super("RLP invalid leading zeros in length");
		this.name = "LeadingZeros";
	}
}

export class NonCanonicalSize extends RlpError {
	constructor() {
		super("RLP non-canonical size encoding");
		this.name = "NonCanonicalSize";
	}
}

/**
 * RLP encoding types
 */
export type RlpInput = string | number | bigint | Uint8Array | RlpInput[];

export type RlpDecoded = Uint8Array | RlpDecoded[];

/**
 * Helper: Convert input to raw bytes (not RLP encoded)
 */
function toBytes(data: RlpInput): Uint8Array {
	if (data instanceof Uint8Array) {
		return data;
	}
	if (typeof data === "string") {
		return new TextEncoder().encode(data);
	}
	if (typeof data === "number" || typeof data === "bigint") {
		// Convert to raw bytes (NOT RLP encoded)
		const n = typeof data === "bigint" ? data : BigInt(data);
		if (n === 0n) {
			return new Uint8Array(0);
		}
		const bytes: number[] = [];
		let remaining = n;
		while (remaining > 0n) {
			bytes.unshift(Number(remaining & 0xffn));
			remaining = remaining >> 8n;
		}
		return new Uint8Array(bytes);
	}
	if (Array.isArray(data)) {
		return encodeList(data);
	}
	throw new Error("Unsupported input type");
}

/**
 * Helper: Encode bytes as RLP string
 */
function encodeBytes(data: Uint8Array): Uint8Array {
	// Empty string
	if (data.length === 0) {
		return new Uint8Array([0x80]);
	}

	// Single byte [0x00, 0x7f] - encoded as itself
	if (data.length === 1 && data[0] < 0x80) {
		return data;
	}

	// Short string [1-55 bytes]
	if (data.length <= 55) {
		const result = new Uint8Array(1 + data.length);
		result[0] = 0x80 + data.length;
		result.set(data, 1);
		return result;
	}

	// Long string [56+ bytes]
	const lengthBytes = encodeLengthBytes(data.length);
	const result = new Uint8Array(1 + lengthBytes.length + data.length);
	result[0] = 0xb7 + lengthBytes.length;
	result.set(lengthBytes, 1);
	result.set(data, 1 + lengthBytes.length);
	return result;
}

/**
 * Helper: Encode length as big-endian bytes
 */
function encodeLengthBytes(length: number): Uint8Array {
	if (length === 0) return new Uint8Array(0);

	const bytes: number[] = [];
	let n = length;
	while (n > 0) {
		bytes.unshift(n & 0xff);
		n = n >>> 8;
	}
	return new Uint8Array(bytes);
}

/**
 * Helper: Decode length from bytes
 */
function decodeLengthBytes(
	data: Uint8Array,
	offset: number,
	lengthOfLength: number,
): number {
	if (lengthOfLength === 0) return 0;
	if (offset + lengthOfLength > data.length) {
		throw new InputTooShort();
	}

	// Check for leading zeros
	if (lengthOfLength > 1 && data[offset] === 0) {
		throw new LeadingZeros();
	}

	let length = 0;
	for (let i = 0; i < lengthOfLength; i++) {
		length = (length << 8) | data[offset + i];
	}
	return length;
}

/**
 * Encode data into RLP format
 *
 * @param data - Data to encode (string, number, bytes, or nested array)
 * @returns RLP-encoded bytes
 */
export function encode(data: RlpInput): Uint8Array {
	if (Array.isArray(data)) {
		return encodeList(data);
	}

	const bytes = toBytes(data);
	return encodeBytes(bytes);
}

/**
 * Decode RLP-encoded data
 *
 * @param data - RLP-encoded bytes
 * @returns Decoded data structure
 */
export function decode(data: Uint8Array): RlpDecoded {
	if (data.length === 0) {
		throw new InputTooShort();
	}

	const [decoded, consumed] = decodeItem(data, 0);

	if (consumed !== data.length) {
		throw new Error("RLP data has trailing bytes");
	}

	return decoded;
}

/**
 * Internal: Decode single RLP item
 */
function decodeItem(data: Uint8Array, offset: number): [RlpDecoded, number] {
	if (offset >= data.length) {
		throw new InputTooShort();
	}

	const prefix = data[offset];

	// Single byte [0x00, 0x7f]
	if (prefix < 0x80) {
		return [new Uint8Array([prefix]), offset + 1];
	}

	// Short string [0x80, 0xb7]
	if (prefix <= 0xb7) {
		const length = prefix - 0x80;

		// Check for non-canonical encoding
		if (length === 1 && offset + 1 < data.length && data[offset + 1] < 0x80) {
			throw new NonCanonicalSize();
		}

		if (offset + 1 + length > data.length) {
			throw new InputTooShort();
		}

		return [data.slice(offset + 1, offset + 1 + length), offset + 1 + length];
	}

	// Long string [0xb8, 0xbf]
	if (prefix <= 0xbf) {
		const lengthOfLength = prefix - 0xb7;

		// Check bounds
		if (offset + 1 + lengthOfLength > data.length) {
			throw new InputTooShort();
		}

		// Check for leading zeros in length (including single-byte case)
		if (offset + 1 < data.length && data[offset + 1] === 0) {
			throw new LeadingZeros();
		}

		const length = decodeLengthBytes(data, offset + 1, lengthOfLength);

		// Check for non-canonical size
		if (length <= 55) {
			throw new NonCanonicalSize();
		}

		const dataStart = offset + 1 + lengthOfLength;
		if (dataStart + length > data.length) {
			throw new InputTooShort();
		}

		return [data.slice(dataStart, dataStart + length), dataStart + length];
	}

	// Short list [0xc0, 0xf7]
	if (prefix <= 0xf7) {
		const length = prefix - 0xc0;
		const listEnd = offset + 1 + length;

		if (listEnd > data.length) {
			throw new InputTooShort();
		}

		const items: RlpDecoded[] = [];
		let pos = offset + 1;

		while (pos < listEnd) {
			const [item, newPos] = decodeItem(data, pos);
			items.push(item);
			pos = newPos;
		}

		if (pos !== listEnd) {
			throw new Error("RLP list length mismatch");
		}

		return [items, listEnd];
	}

	// Long list [0xf8, 0xff]
	const lengthOfLength = prefix - 0xf7;
	const length = decodeLengthBytes(data, offset + 1, lengthOfLength);

	// Check for non-canonical size
	if (length <= 55) {
		throw new NonCanonicalSize();
	}

	const listStart = offset + 1 + lengthOfLength;
	const listEnd = listStart + length;

	if (listEnd > data.length) {
		throw new InputTooShort();
	}

	const items: RlpDecoded[] = [];
	let pos = listStart;

	while (pos < listEnd) {
		const [item, newPos] = decodeItem(data, pos);
		items.push(item);
		pos = newPos;
	}

	if (pos !== listEnd) {
		throw new Error("RLP list length mismatch");
	}

	return [items, listEnd];
}

/**
 * Encode a list of items into RLP format
 *
 * @param items - Array of items to encode
 * @returns RLP-encoded list
 */
export function encodeList(items: RlpInput[]): Uint8Array {
	// Encode all items
	const encodedItems = items.map((item) => encode(item));

	// Calculate total length
	const totalLength = encodedItems.reduce((sum, item) => sum + item.length, 0);

	// Short list [0-55 bytes]
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

	// Long list [56+ bytes]
	const lengthBytes = encodeLengthBytes(totalLength);
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
 * Encode an unsigned integer into RLP format
 *
 * @param value - Number or bigint to encode
 * @returns RLP-encoded integer
 */
export function encodeUint(value: number | bigint): Uint8Array {
	// Convert to bigint for uniform handling
	const n = typeof value === "bigint" ? value : BigInt(value);

	// Zero is encoded as empty string
	if (n === 0n) {
		return encodeBytes(new Uint8Array(0));
	}

	// Convert to bytes (big-endian, no leading zeros)
	const bytes: number[] = [];
	let remaining = n;
	while (remaining > 0n) {
		bytes.unshift(Number(remaining & 0xffn));
		remaining = remaining >> 8n;
	}

	return encodeBytes(new Uint8Array(bytes));
}

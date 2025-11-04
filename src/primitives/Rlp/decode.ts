import type { Data, Decoded } from "./Rlp.js";
import { MAX_DEPTH } from "./constants.js";
import { Error } from "./errors.js";
import { decodeLengthValue } from "./utils.js";

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

/**
 * Internal decode implementation with depth tracking
 * @internal
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
			throw new Error(
				"NonCanonicalSize",
				"List < 56 bytes should use short form",
			);
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

	throw new Error(
		"UnexpectedInput",
		`Invalid RLP prefix: 0x${prefix.toString(16)}`,
	);
}

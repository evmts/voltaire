import * as OxRlp from "ox/Rlp";
import { MAX_DEPTH } from "./constants.js";
import { Error } from "./errors.js";

/**
 * @typedef {{
 *   data: import('./BrandedRlp.js').BrandedRlp;
 *   remainder: Uint8Array;
 * }} Decoded
 */

/**
 * Calculate the total length of an RLP-encoded item and validate canonical encoding
 * @internal
 * @param {Uint8Array} bytes
 * @returns {number}
 */
function getRlpItemLength(bytes) {
	if (bytes.length === 0) {
		throw new Error("InputTooShort", "Cannot decode empty input");
	}

	const prefix = bytes[0];
	if (prefix === undefined) {
		throw new Error("InputTooShort", "Cannot decode empty input");
	}

	// Single byte [0x00, 0x7f]
	if (prefix <= 0x7f) {
		return 1;
	}

	// Short string [0x80, 0xb7]
	if (prefix <= 0xb7) {
		const length = prefix - 0x80;

		// Check for non-canonical encoding: single byte < 0x80 should not be prefixed
		if (length === 1 && bytes.length > 1) {
			const nextByte = bytes[1];
			if (nextByte !== undefined && nextByte < 0x80) {
				throw new Error(
					"NonCanonicalSize",
					"Single byte < 0x80 should not be prefixed",
				);
			}
		}

		if (bytes.length < 1 + length) {
			throw new Error(
				"InputTooShort",
				`Expected ${1 + length} bytes, got ${bytes.length}`,
			);
		}
		return 1 + length;
	}

	// Long string [0xb8, 0xbf]
	if (prefix <= 0xbf) {
		const lengthOfLength = prefix - 0xb7;
		if (bytes.length < 1 + lengthOfLength) {
			throw new Error(
				"InputTooShort",
				`Expected ${1 + lengthOfLength} bytes for length, got ${bytes.length}`,
			);
		}

		// Check for leading zeros
		if (bytes[1] === 0) {
			throw new Error("LeadingZeros", "Length encoding has leading zeros");
		}

		let length = 0;
		for (let i = 0; i < lengthOfLength; i++) {
			const byte = bytes[1 + i];
			if (byte === undefined) {
				throw new Error("InputTooShort", "Unexpected end of input");
			}
			length = length * 256 + byte;
		}

		// Check for non-canonical encoding: < 56 bytes should use short form
		if (length < 56) {
			throw new Error(
				"NonCanonicalSize",
				"String < 56 bytes should use short form",
			);
		}

		if (bytes.length < 1 + lengthOfLength + length) {
			throw new Error(
				"InputTooShort",
				`Expected ${1 + lengthOfLength + length} bytes, got ${bytes.length}`,
			);
		}
		return 1 + lengthOfLength + length;
	}

	// Short list [0xc0, 0xf7]
	if (prefix <= 0xf7) {
		const length = prefix - 0xc0;
		if (bytes.length < 1 + length) {
			throw new Error(
				"InputTooShort",
				`Expected ${1 + length} bytes, got ${bytes.length}`,
			);
		}
		return 1 + length;
	}

	// Long list [0xf8, 0xff]
	const lengthOfLength = prefix - 0xf7;
	if (bytes.length < 1 + lengthOfLength) {
		throw new Error(
			"InputTooShort",
			`Expected ${1 + lengthOfLength} bytes for length, got ${bytes.length}`,
		);
	}

	// Check for leading zeros
	if (bytes[1] === 0) {
		throw new Error("LeadingZeros", "Length encoding has leading zeros");
	}

	let length = 0;
	for (let i = 0; i < lengthOfLength; i++) {
		const byte = bytes[1 + i];
		if (byte === undefined) {
			throw new Error("InputTooShort", "Unexpected end of input");
		}
		length = length * 256 + byte;
	}

	// Check for non-canonical encoding: < 56 bytes should use short form
	if (length < 56) {
		throw new Error(
			"NonCanonicalSize",
			"List < 56 bytes should use short form",
		);
	}

	if (bytes.length < 1 + lengthOfLength + length) {
		throw new Error(
			"InputTooShort",
			`Expected ${1 + lengthOfLength + length} bytes, got ${bytes.length}`,
		);
	}
	return 1 + lengthOfLength + length;
}

/**
 * Convert ox/Rlp decoded value to Data structure with depth tracking
 * @internal
 * @param {Uint8Array | any[]} value
 * @param {number} depth
 * @returns {import('./BrandedRlp.js').BrandedRlp}
 */
function toData(value, depth = 0) {
	// Check recursion depth
	if (depth >= MAX_DEPTH) {
		throw new Error(
			"RecursionDepthExceeded",
			`Maximum recursion depth ${MAX_DEPTH} exceeded`,
		);
	}

	if (value instanceof Uint8Array) {
		return { type: "bytes", value };
	}
	if (Array.isArray(value)) {
		return {
			type: "list",
			value: value.map((item) => toData(item, depth + 1)),
		};
	}
	throw new Error("UnexpectedInput", "Invalid decoded value type");
}

/**
 * Decodes RLP-encoded bytes
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - RLP-encoded data
 * @param {boolean} [stream=false] - If true, allows extra data after decoded value. If false, expects exact match
 * @returns {Decoded} Decoded RLP data with remainder
 * @throws {Error} If input is too short, invalid, or has unexpected remainder (when stream=false)
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * // Decode single value
 * const bytes = new Uint8Array([0x83, 1, 2, 3]);
 * const result = Rlp.decode(bytes);
 * // => { data: { type: 'bytes', value: Uint8Array([1, 2, 3]) }, remainder: Uint8Array([]) }
 *
 * // Stream decoding (multiple values)
 * const stream = new Uint8Array([0x01, 0x02]);
 * const result = Rlp.decode(stream, true);
 * // => { data: { type: 'bytes', value: Uint8Array([1]) }, remainder: Uint8Array([2]) }
 *
 * // Decode list
 * const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
 * const result = Rlp.decode(list);
 * ```
 */
export function decode(bytes, stream = false) {
	if (bytes.length === 0) {
		throw new Error("InputTooShort", "Cannot decode empty input");
	}

	try {
		// Calculate item length to determine remainder
		const itemLength = getRlpItemLength(bytes);
		const item = bytes.slice(0, itemLength);
		const remainder = bytes.slice(itemLength);

		if (!stream && remainder.length > 0) {
			throw new Error(
				"InvalidRemainder",
				`Extra data after decoded value: ${remainder.length} bytes`,
			);
		}

		// Decode using ox/Rlp
		const value = OxRlp.toBytes(item);

		return {
			data: toData(/** @type {any} */ (value)),
			remainder,
		};
	} catch (err) {
		// Map ox/Rlp errors to Voltaire error format
		if (err instanceof globalThis.Error && !(err instanceof Error)) {
			const msg = err.message;
			if (msg.includes("empty") || msg.includes("too short")) {
				throw new Error("InputTooShort", msg);
			}
			if (msg.includes("canonical") || msg.includes("invalid")) {
				throw new Error("NonCanonicalSize", msg);
			}
			// Re-throw as generic error
			throw new Error("UnexpectedInput", msg);
		}
		throw err;
	}
}

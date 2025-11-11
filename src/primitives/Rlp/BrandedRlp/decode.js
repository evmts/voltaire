import * as OxRlp from "ox/Rlp";
import { RlpDecodingError } from "./RlpError.js";
import { MAX_DEPTH } from "./constants.js";

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
		throw new RlpDecodingError("Cannot decode empty input", {
			code: "RLP_INPUT_TOO_SHORT",
		});
	}

	const prefix = bytes[0];
	if (prefix === undefined) {
		throw new RlpDecodingError("Cannot decode empty input", {
			code: "RLP_INPUT_TOO_SHORT",
		});
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
				throw new RlpDecodingError(
					"Single byte < 0x80 should not be prefixed",
					{
						code: "RLP_NON_CANONICAL_SIZE",
						context: { prefix, nextByte },
					},
				);
			}
		}

		if (bytes.length < 1 + length) {
			throw new RlpDecodingError(
				`Expected ${1 + length} bytes, got ${bytes.length}`,
				{
					code: "RLP_INPUT_TOO_SHORT",
					context: { expected: 1 + length, actual: bytes.length },
				},
			);
		}
		return 1 + length;
	}

	// Long string [0xb8, 0xbf]
	if (prefix <= 0xbf) {
		const lengthOfLength = prefix - 0xb7;
		if (bytes.length < 1 + lengthOfLength) {
			throw new RlpDecodingError(
				`Expected ${1 + lengthOfLength} bytes for length, got ${bytes.length}`,
				{
					code: "RLP_INPUT_TOO_SHORT",
					context: { expected: 1 + lengthOfLength, actual: bytes.length },
				},
			);
		}

		// Check for leading zeros
		if (bytes[1] === 0) {
			throw new RlpDecodingError("Length encoding has leading zeros", {
				code: "RLP_LEADING_ZEROS",
				context: { prefix },
			});
		}

		let length = 0;
		for (let i = 0; i < lengthOfLength; i++) {
			const byte = bytes[1 + i];
			if (byte === undefined) {
				throw new RlpDecodingError("Unexpected end of input", {
					code: "RLP_INPUT_TOO_SHORT",
				});
			}
			length = length * 256 + byte;
		}

		// Check for non-canonical encoding: < 56 bytes should use short form
		if (length < 56) {
			throw new RlpDecodingError("String < 56 bytes should use short form", {
				code: "RLP_NON_CANONICAL_SIZE",
				context: { length, prefix },
			});
		}

		if (bytes.length < 1 + lengthOfLength + length) {
			throw new RlpDecodingError(
				`Expected ${1 + lengthOfLength + length} bytes, got ${bytes.length}`,
				{
					code: "RLP_INPUT_TOO_SHORT",
					context: {
						expected: 1 + lengthOfLength + length,
						actual: bytes.length,
					},
				},
			);
		}
		return 1 + lengthOfLength + length;
	}

	// Short list [0xc0, 0xf7]
	if (prefix <= 0xf7) {
		const length = prefix - 0xc0;
		if (bytes.length < 1 + length) {
			throw new RlpDecodingError(
				`Expected ${1 + length} bytes, got ${bytes.length}`,
				{
					code: "RLP_INPUT_TOO_SHORT",
					context: { expected: 1 + length, actual: bytes.length },
				},
			);
		}
		return 1 + length;
	}

	// Long list [0xf8, 0xff]
	const lengthOfLength = prefix - 0xf7;
	if (bytes.length < 1 + lengthOfLength) {
		throw new RlpDecodingError(
			`Expected ${1 + lengthOfLength} bytes for length, got ${bytes.length}`,
			{
				code: "RLP_INPUT_TOO_SHORT",
				context: { expected: 1 + lengthOfLength, actual: bytes.length },
			},
		);
	}

	// Check for leading zeros
	if (bytes[1] === 0) {
		throw new RlpDecodingError("Length encoding has leading zeros", {
			code: "RLP_LEADING_ZEROS",
			context: { prefix },
		});
	}

	let length = 0;
	for (let i = 0; i < lengthOfLength; i++) {
		const byte = bytes[1 + i];
		if (byte === undefined) {
			throw new RlpDecodingError("Unexpected end of input", {
				code: "RLP_INPUT_TOO_SHORT",
			});
		}
		length = length * 256 + byte;
	}

	// Check for non-canonical encoding: < 56 bytes should use short form
	if (length < 56) {
		throw new RlpDecodingError("List < 56 bytes should use short form", {
			code: "RLP_NON_CANONICAL_SIZE",
			context: { length, prefix },
		});
	}

	if (bytes.length < 1 + lengthOfLength + length) {
		throw new RlpDecodingError(
			`Expected ${1 + lengthOfLength + length} bytes, got ${bytes.length}`,
			{
				code: "RLP_INPUT_TOO_SHORT",
				context: {
					expected: 1 + lengthOfLength + length,
					actual: bytes.length,
				},
			},
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
		throw new RlpDecodingError(
			`Maximum recursion depth ${MAX_DEPTH} exceeded`,
			{
				code: "RLP_RECURSION_DEPTH_EXCEEDED",
				context: { depth, maxDepth: MAX_DEPTH },
			},
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
	throw new RlpDecodingError("Invalid decoded value type", {
		code: "RLP_UNEXPECTED_INPUT",
		context: { type: typeof value },
	});
}

/**
 * Decodes RLP-encoded bytes
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - RLP-encoded data
 * @param {boolean} [stream=false] - If true, allows extra data after decoded value. If false, expects exact match
 * @returns {Decoded} Decoded RLP data with remainder
 * @throws {RlpDecodingError} If input is too short, invalid, or has unexpected remainder (when stream=false)
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
		throw new RlpDecodingError("Cannot decode empty input", {
			code: "RLP_INPUT_TOO_SHORT",
		});
	}

	try {
		// Calculate item length to determine remainder
		const itemLength = getRlpItemLength(bytes);
		const item = bytes.slice(0, itemLength);
		const remainder = bytes.slice(itemLength);

		if (!stream && remainder.length > 0) {
			throw new RlpDecodingError(
				`Extra data after decoded value: ${remainder.length} bytes`,
				{
					code: "RLP_INVALID_REMAINDER",
					context: { remainderLength: remainder.length },
				},
			);
		}

		// Decode using ox/Rlp
		const value = OxRlp.toBytes(item);

		return {
			data: toData(/** @type {any} */ (value)),
			remainder,
		};
	} catch (err) {
		// Re-throw RlpDecodingError as-is
		if (err instanceof RlpDecodingError) {
			throw err;
		}
		// Map ox/Rlp errors to Voltaire error format
		if (err instanceof globalThis.Error) {
			const msg = err.message;
			if (msg.includes("empty") || msg.includes("too short")) {
				throw new RlpDecodingError(msg, {
					code: "RLP_INPUT_TOO_SHORT",
					cause: err,
				});
			}
			if (msg.includes("canonical") || msg.includes("invalid")) {
				throw new RlpDecodingError(msg, {
					code: "RLP_NON_CANONICAL_SIZE",
					cause: err,
				});
			}
			// Re-throw as generic error
			throw new RlpDecodingError(msg, {
				code: "RLP_UNEXPECTED_INPUT",
				cause: err,
			});
		}
		throw err;
	}
}

import * as OxRlp from "ox/Rlp";
import { getRlpItemLength } from "./getRlpItemLength.js";
import { RlpDecodingError } from "./RlpError.js";
import { MAX_DEPTH } from "./constants.js";

/**
 * @typedef {{
 *   data: import('./RlpType.js').BrandedRlp;
 *   remainder: Uint8Array;
 * }} Decoded
 */

/**
 * Convert ox/Rlp decoded value to Data structure with depth tracking
 * @internal
 * @param {Uint8Array | any[]} value
 * @param {number} depth
 * @returns {import('./RlpType.js').BrandedRlp}
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
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: RLP decoding requires many conditions
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

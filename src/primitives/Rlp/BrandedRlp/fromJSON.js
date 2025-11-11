import { RlpDecodingError } from "./RlpError.js";

/**
 * Convert JSON representation back to RLP Data
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {unknown} json - JSON object from toJSON
 * @returns {import('./BrandedRlp.js').BrandedRlp} RLP data structure
 * @throws {RlpDecodingError} If JSON format is invalid or type is unrecognized
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const json = { type: 'bytes', value: [1, 2, 3] };
 * const data = Rlp.fromJSON(json);
 * // => { type: 'bytes', value: Uint8Array([1, 2, 3]) }
 * ```
 */
export function fromJSON(json) {
	if (
		typeof json !== "object" ||
		json === null ||
		!("type" in json) ||
		!("value" in json)
	) {
		throw new RlpDecodingError("Invalid JSON format", {
			code: "RLP_INVALID_JSON",
			context: { json },
		});
	}

	if (json.type === "bytes") {
		if (!Array.isArray(json.value)) {
			throw new RlpDecodingError("Bytes value must be array", {
				code: "RLP_INVALID_JSON",
				context: { type: "bytes", valueType: typeof json.value },
			});
		}
		return {
			type: "bytes",
			value: new Uint8Array(json.value),
		};
	}

	if (json.type === "list") {
		if (!Array.isArray(json.value)) {
			throw new RlpDecodingError("List value must be array", {
				code: "RLP_INVALID_JSON",
				context: { type: "list", valueType: typeof json.value },
			});
		}
		return {
			type: "list",
			value: json.value.map((item) => fromJSON(item)),
		};
	}

	throw new RlpDecodingError(`Invalid type: ${json.type}`, {
		code: "RLP_INVALID_JSON",
		context: { type: json.type },
	});
}

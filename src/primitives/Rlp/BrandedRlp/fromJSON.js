import { Error } from "./errors.js";

/**
 * Convert JSON representation back to RLP Data
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {unknown} json - JSON object from toJSON
 * @returns {import('./BrandedRlp.js').BrandedRlp} RLP data structure
 * @throws {Error} If JSON format is invalid or type is unrecognized
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
		throw new Error("UnexpectedInput", "Invalid JSON format");
	}

	if (json.type === "bytes") {
		if (!Array.isArray(json.value)) {
			throw new Error("UnexpectedInput", "Bytes value must be array");
		}
		return {
			type: "bytes",
			value: new Uint8Array(json.value),
		};
	}

	if (json.type === "list") {
		if (!Array.isArray(json.value)) {
			throw new Error("UnexpectedInput", "List value must be array");
		}
		return {
			type: "list",
			value: json.value.map((item) => fromJSON(item)),
		};
	}

	throw new Error("UnexpectedInput", `Invalid type: ${json.type}`);
}

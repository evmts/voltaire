import type { BrandedRlp } from "./BrandedRlp.js";
import { Error } from "./errors.js";

/**
 * Convert JSON representation back to RLP Data
 *
 * @param json - JSON object from toJSON
 * @returns RLP Data
 *
 * @example
 * ```typescript
 * const json = { type: 'bytes', value: [1, 2, 3] };
 * const data = Rlp.fromJSON(json);
 * // => { type: 'bytes', value: Uint8Array([1, 2, 3]) }
 * ```
 */
export function fromJSON(json: unknown): BrandedRlp {
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

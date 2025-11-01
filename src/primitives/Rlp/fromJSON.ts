import type { Data } from "./Rlp.js";
import { Error } from "./errors.js";

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

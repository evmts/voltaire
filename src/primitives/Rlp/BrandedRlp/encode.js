import * as OxRlp from "ox/Rlp";
import { RlpEncodingError } from "./RlpError.js";
import { isData } from "./isData.js";

/**
 * @typedef {Uint8Array | import('./BrandedRlp.js').BrandedRlp | Array<Uint8Array | import('./BrandedRlp.js').BrandedRlp | any>} Encodable
 */

/**
 * Convert Data structure to ox/Rlp compatible format
 * @internal
 * @param {import('./BrandedRlp.js').BrandedRlp} data
 * @returns {Uint8Array | any[]}
 */
function dataToEncodable(data) {
	if (data.type === "bytes") {
		return data.value;
	}
	return data.value.map((item) => dataToEncodable(item));
}

/**
 * Encodes data to RLP format
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Encodable} data - Data to encode (Uint8Array, RlpData, or array)
 * @returns {Uint8Array} RLP-encoded bytes
 * @throws {RlpEncodingError} If data type is invalid or encoding fails
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * // Encode bytes
 * const bytes = new Uint8Array([1, 2, 3]);
 * const encoded = Rlp.encode(bytes);
 * // => Uint8Array([0x83, 1, 2, 3])
 *
 * // Encode list
 * const list = [new Uint8Array([1, 2]), new Uint8Array([3, 4])];
 * const encoded = Rlp.encode(list);
 *
 * // Encode nested structures
 * const nested = [new Uint8Array([1]), [new Uint8Array([2]), new Uint8Array([3])]];
 * const encoded = Rlp.encode(nested);
 * ```
 */
export function encode(data) {
	// Handle Data structure
	if (isData(data)) {
		const encodable = dataToEncodable(data);
		return OxRlp.from(encodable, { as: "Bytes" });
	}

	// Handle Uint8Array and arrays directly
	if (data instanceof Uint8Array || Array.isArray(data)) {
		return OxRlp.from(data, { as: "Bytes" });
	}

	throw new RlpEncodingError("Invalid encodable data type", {
		code: "RLP_INVALID_TYPE",
		context: { type: typeof data },
	});
}

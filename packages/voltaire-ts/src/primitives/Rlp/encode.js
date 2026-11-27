import { encodeBytes } from "./encodeBytes.js";
import { encodeList } from "./encodeList.js";
import { isData } from "./isData.js";
import { RlpEncodingError } from "./RlpError.js";

/**
 * @typedef {import('./RlpType.js').Encodable} Encodable
 */

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
	if (data instanceof Uint8Array) {
		return encodeBytes(data);
	}

	if (Array.isArray(data)) {
		return encodeList(data);
	}

	if (isData(data)) {
		return data.type === "bytes"
			? encodeBytes(data.value)
			: encodeList(data.value);
	}

	throw new RlpEncodingError("Invalid encodable data type", {
		code: "RLP_INVALID_TYPE",
		context: { type: typeof data },
	});
}

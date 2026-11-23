import { DecodingError } from "../../errors/index.js";
import { decode } from "../../Rlp/decode.js";
import { Type } from "../types.js";
import {
	decodeAddress,
	decodeBytesField,
	decodeSignatureScalar,
	decodeUint,
} from "../utils.js";

/**
 * Deserialize RLP encoded legacy transaction.
 *
 * Integers must be canonical RLP (no leading zero bytes). `r` and `s` are
 * left-padded to 32 bytes.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP encoded transaction data
 * @returns {import('./TransactionLegacyType.js').TransactionLegacyType} Deserialized legacy transaction
 * @throws {DecodingError} If data is invalid or not a valid legacy transaction
 * @example
 * ```javascript
 * import { deserialize } from './primitives/Transaction/Legacy/deserialize.js';
 * const tx = deserialize(rlpBytes);
 * ```
 */
export function deserialize(data) {
	const decoded = decode(data);
	if (decoded.data.type !== "list") {
		throw new DecodingError("Invalid legacy transaction: expected list", {
			code: -32602,
			context: { type: decoded.data.type },
			docsPath: "/primitives/transaction/legacy/deserialize#error-handling",
		});
	}

	const fields = decoded.data.value;
	if (fields.length !== 9) {
		throw new DecodingError(
			`Invalid legacy transaction: expected 9 fields, got ${fields.length}`,
			{
				code: -32602,
				context: { expected: 9, actual: fields.length },
				docsPath: "/primitives/transaction/legacy/deserialize#error-handling",
			},
		);
	}

	// Every field is a byte string; integers are canonical (no leading zeros).
	for (let i = 0; i < fields.length; i++) {
		if (fields[i]?.type !== "bytes") {
			throw new DecodingError(
				`Invalid legacy transaction: field ${i} must be bytes`,
				{
					code: -32602,
					context: { fieldIndex: i, type: fields[i]?.type },
					docsPath: "/primitives/transaction/legacy/deserialize#error-handling",
				},
			);
		}
	}

	const nonce = decodeUint(fields[0], 8, "nonce");
	const gasPrice = decodeUint(fields[1], 32, "gasPrice");
	const gasLimit = decodeUint(fields[2], 8, "gasLimit");
	const to = decodeAddress(decodeBytesField(fields[3], "to"));
	const value = decodeUint(fields[4], 32, "value");
	const dataBytes = decodeBytesField(fields[5], "data");
	const v = decodeUint(fields[6], 32, "v");
	const r = decodeSignatureScalar(decodeBytesField(fields[7], "r"));
	const s = decodeSignatureScalar(decodeBytesField(fields[8], "s"));

	return /** @type {import('./TransactionLegacyType.js').TransactionLegacyType} */ (
		/** @type {any} */ ({
			type: Type.Legacy,
			nonce,
			gasPrice,
			gasLimit,
			to,
			value,
			data: dataBytes,
			v,
			r,
			s,
		})
	);
}

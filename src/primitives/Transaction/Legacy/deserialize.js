import { decode } from "../../Rlp/BrandedRlp/decode.js";
import { DecodingError } from "../../errors/index.js";
import { Type } from "../types.js";
import { decodeAddress, decodeBigint } from "../utils.js";

/**
 * Deserialize RLP encoded legacy transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP encoded transaction data
 * @returns {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy} Deserialized legacy transaction
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
			code: "INVALID_LEGACY_TRANSACTION_FORMAT",
			context: { type: decoded.data.type },
			docsPath: "/primitives/transaction/legacy/deserialize#error-handling",
		});
	}

	const fields = decoded.data.value;
	if (fields.length !== 9) {
		throw new DecodingError(
			`Invalid legacy transaction: expected 9 fields, got ${fields.length}`,
			{
				code: "INVALID_LEGACY_TRANSACTION_FIELD_COUNT",
				context: { expected: 9, actual: fields.length },
				docsPath: "/primitives/transaction/legacy/deserialize#error-handling",
			},
		);
	}

	// Validate all fields are bytes
	for (let i = 0; i < fields.length; i++) {
		if (fields[i]?.type !== "bytes") {
			throw new DecodingError(
				`Invalid legacy transaction: field ${i} must be bytes`,
				{
					code: "INVALID_LEGACY_TRANSACTION_FIELD_TYPE",
					context: { fieldIndex: i, type: fields[i]?.type },
					docsPath: "/primitives/transaction/legacy/deserialize#error-handling",
				},
			);
		}
	}

	// Extract bytes from Data structures
	const nonce = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[0]).value,
	);
	const gasPrice = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[1]).value,
	);
	const gasLimit = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[2]).value,
	);
	const to = decodeAddress(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[3]).value,
	);
	const value = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[4]).value,
	);
	const dataBytes = /** @type {{ type: "bytes"; value: Uint8Array }} */ (
		fields[5]
	).value;
	const v = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[6]).value,
	);
	const r = /** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[7])
		.value;
	const s = /** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[8])
		.value;

	return /** @type {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy} */ ({
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
	});
}

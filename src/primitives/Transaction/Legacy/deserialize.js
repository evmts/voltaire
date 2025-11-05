import { decode } from "../../Rlp/decode.js";
import { Type } from "../types.js";
import { decodeAddress, decodeBigint } from "../utils.js";

/**
 * Deserialize RLP encoded legacy transaction
 *
 * @param {Uint8Array} data - RLP encoded transaction data
 * @returns {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy} Deserialized legacy transaction
 * @throws {Error} If data is invalid or not a valid legacy transaction
 *
 * @example
 * ```typescript
 * const tx = TransactionLegacy.deserialize(rlpBytes);
 * ```
 */
export function deserialize(data) {
	const decoded = decode(data);
	if (decoded.data.type !== "list") {
		throw new Error("Invalid legacy transaction: expected list");
	}

	const fields = decoded.data.value;
	if (fields.length !== 9) {
		throw new Error(
			`Invalid legacy transaction: expected 9 fields, got ${fields.length}`,
		);
	}

	// Validate all fields are bytes
	for (let i = 0; i < fields.length; i++) {
		if (fields[i]?.type !== "bytes") {
			throw new Error(`Invalid legacy transaction: field ${i} must be bytes`);
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

	return {
		__tag: "TransactionLegacy",
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
	};
}

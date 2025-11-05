import { decode } from "../../Rlp/BrandedRlp/decode.js";
import { Type } from "../types.js";
import { decodeAccessList, decodeAddress, decodeBigint } from "../utils.js";

/**
 * Deserialize RLP encoded EIP-2930 transaction
 *
 * @param {Uint8Array} data - RLP encoded transaction bytes
 * @returns {import('./BrandedTransactionEIP2930.js').BrandedTransactionEIP2930} Deserialized transaction
 * @throws {Error} If data is invalid or malformed
 *
 * @example
 * ```typescript
 * const tx = TransactionEIP2930.deserialize(bytes);
 * ```
 */
export function deserialize(data) {
	if (data.length === 0 || data[0] !== Type.EIP2930) {
		throw new Error("Invalid EIP-2930 transaction: missing or wrong type byte");
	}

	const rlpData = data.slice(1);
	const decoded = decode(rlpData);

	if (decoded.data.type !== "list") {
		throw new Error("Invalid EIP-2930 transaction: expected list");
	}

	const fields = decoded.data.value;
	if (fields.length !== 11) {
		throw new Error(
			`Invalid EIP-2930 transaction: expected 11 fields, got ${fields.length}`,
		);
	}

	const chainId = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[0]).value,
	);
	const nonce = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[1]).value,
	);
	const gasPrice = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[2]).value,
	);
	const gasLimit = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[3]).value,
	);
	const to = decodeAddress(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[4]).value,
	);
	const value = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[5]).value,
	);
	const dataBytes = /** @type {{ type: "bytes"; value: Uint8Array }} */ (
		fields[6]
	).value;
	const accessListField = fields[7];
	if (!accessListField || accessListField.type !== "list") {
		throw new Error("Invalid EIP-2930 transaction: expected list for accessList");
	}
	const accessList = decodeAccessList(
		/** @type {import('../../Rlp/BrandedRlp/BrandedRlp.js').BrandedRlp[]} */ (accessListField.value),
	);
	const yParityBytes = /** @type {{ type: "bytes"; value: Uint8Array }} */ (
		fields[8]
	).value;
	const yParity = yParityBytes.length > 0 ? (yParityBytes[0] ?? 0) : 0;
	const r = /** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[9])
		.value;
	const s = /** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[10])
		.value;

	return {
		__tag: "TransactionEIP2930",
		type: Type.EIP2930,
		chainId,
		nonce,
		gasPrice,
		gasLimit,
		to,
		value,
		data: dataBytes,
		accessList,
		yParity,
		r,
		s,
	};
}

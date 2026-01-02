import { DecodingError, InvalidFormatError } from "../../errors/index.js";
import { decode } from "../../Rlp/decode.js";
import { Type } from "../types.js";
import { decodeAccessList, decodeAddress, decodeBigint } from "../utils.js";

/**
 * Deserialize RLP encoded EIP-2930 transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP encoded transaction bytes
 * @returns {import('./TransactionEIP2930Type.js').TransactionEIP2930Type} Deserialized transaction
 * @throws {DecodingError} If data is invalid or malformed
 * @throws {InvalidFormatError} If access list format is invalid
 * @example
 * ```javascript
 * import { deserialize } from './primitives/Transaction/EIP2930/deserialize.js';
 * const tx = deserialize(bytes);
 * ```
 */
export function deserialize(data) {
	if (data.length === 0 || data[0] !== Type.EIP2930) {
		throw new DecodingError(
			"Invalid EIP-2930 transaction: missing or wrong type byte",
			{
				code: "INVALID_EIP2930_TYPE_BYTE",
				context: { typeByte: data[0] },
				docsPath: "/primitives/transaction/eip2930/deserialize#error-handling",
			},
		);
	}

	const rlpData = data.slice(1);
	const decoded = decode(rlpData);

	if (decoded.data.type !== "list") {
		throw new DecodingError("Invalid EIP-2930 transaction: expected list", {
			code: "INVALID_EIP2930_FORMAT",
			context: { type: decoded.data.type },
			docsPath: "/primitives/transaction/eip2930/deserialize#error-handling",
		});
	}

	const fields = decoded.data.value;
	if (fields.length !== 11) {
		throw new DecodingError(
			`Invalid EIP-2930 transaction: expected 11 fields, got ${fields.length}`,
			{
				code: "INVALID_EIP2930_FIELD_COUNT",
				context: { expected: 11, actual: fields.length },
				docsPath: "/primitives/transaction/eip2930/deserialize#error-handling",
			},
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
		throw new InvalidFormatError(
			"Invalid EIP-2930 transaction: expected list for accessList",
			{
				code: "INVALID_ACCESS_LIST_FORMAT",
				value: accessListField,
				expected: "List of access list items",
				docsPath: "/primitives/transaction/eip2930/deserialize#error-handling",
			},
		);
	}
	const accessList = decodeAccessList(
		/** @type {import('../../Rlp/BrandedRlp.js').BrandedRlp[]} */ (
			accessListField.value
		),
	);
	const yParityBytes = /** @type {{ type: "bytes"; value: Uint8Array }} */ (
		fields[8]
	).value;
	const yParity = yParityBytes.length > 0 ? (yParityBytes[0] ?? 0) : 0;
	if (yParity !== 0 && yParity !== 1) {
		throw new DecodingError(
			`Invalid EIP-2930 transaction: yParity must be 0 or 1, got ${yParity}`,
			{
				code: "INVALID_YPARITY",
				context: { yParity },
				docsPath: "/primitives/transaction/eip2930/deserialize#error-handling",
			},
		);
	}
	const r = /** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[9])
		.value;
	const s = /** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[10])
		.value;

	return /** @type {import('./TransactionEIP2930Type.js').TransactionEIP2930Type} */ (
		/** @type {any} */ ({
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
		})
	);
}

import { decode } from "../../Rlp/BrandedRlp/decode.js";
import { DecodingError } from "../../errors/index.js";
import { Type } from "../types.js";
import { decodeAccessList, decodeAddress, decodeBigint } from "../utils.js";

/**
 * Deserialize RLP encoded EIP-1559 transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP encoded transaction with type byte prefix
 * @returns {import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559} Deserialized transaction
 * @throws {DecodingError} If transaction format is invalid
 * @example
 * ```javascript
 * import { deserialize } from './primitives/Transaction/EIP1559/deserialize.js';
 * const tx = deserialize(encodedBytes);
 * ```
 */
export function deserialize(data) {
	if (data.length === 0 || data[0] !== Type.EIP1559) {
		throw new DecodingError(
			"Invalid EIP-1559 transaction: missing or wrong type byte",
			{
				code: "INVALID_EIP1559_TYPE_BYTE",
				context: { typeByte: data[0] },
				docsPath: "/primitives/transaction/eip1559/deserialize#error-handling",
			},
		);
	}

	const rlpData = data.slice(1);
	const decoded = decode(rlpData);

	if (decoded.data.type !== "list") {
		throw new DecodingError("Invalid EIP-1559 transaction: expected list", {
			code: "INVALID_EIP1559_FORMAT",
			context: { type: decoded.data.type },
			docsPath: "/primitives/transaction/eip1559/deserialize#error-handling",
		});
	}

	const fields = decoded.data.value;
	if (fields.length !== 12) {
		throw new DecodingError(
			`Invalid EIP-1559 transaction: expected 12 fields, got ${fields.length}`,
			{
				code: "INVALID_EIP1559_FIELD_COUNT",
				context: { expected: 12, actual: fields.length },
				docsPath: "/primitives/transaction/eip1559/deserialize#error-handling",
			},
		);
	}

	const chainId = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[0]).value,
	);
	const nonce = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[1]).value,
	);
	const maxPriorityFeePerGas = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[2]).value,
	);
	const maxFeePerGas = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[3]).value,
	);
	const gasLimit = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[4]).value,
	);
	const to = decodeAddress(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[5]).value,
	);
	const value = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[6]).value,
	);
	const dataBytes = /** @type {{ type: "bytes"; value: Uint8Array }} */ (
		fields[7]
	).value;
	const accessList = decodeAccessList(/** @type {any} */ (fields[8]).value);
	const yParityBytes = /** @type {{ type: "bytes"; value: Uint8Array }} */ (
		fields[9]
	).value;
	const yParity =
		yParityBytes.length > 0 ? /** @type {number} */ (yParityBytes[0]) : 0;
	const r = /** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[10])
		.value;
	const s = /** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[11])
		.value;

	return /** @type {import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559} */ (
		/** @type {any} */ ({
			type: Type.EIP1559,
			chainId,
			nonce,
			maxPriorityFeePerGas,
			maxFeePerGas,
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

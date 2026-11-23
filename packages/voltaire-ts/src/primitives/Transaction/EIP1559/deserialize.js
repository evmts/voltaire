import { DecodingError } from "../../errors/index.js";
import { decode } from "../../Rlp/decode.js";
import { Type } from "../types.js";
import {
	decodeAccessList,
	decodeAddress,
	decodeBytesField,
	decodeListField,
	decodeSignatureScalar,
	decodeUint,
	decodeYParity,
} from "../utils.js";

/**
 * Deserialize RLP encoded EIP-1559 transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP encoded transaction with type byte prefix
 * @returns {import('./TransactionEIP1559Type.js').BrandedTransactionEIP1559} Deserialized transaction
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
				code: -32602,
				context: { typeByte: data[0] },
				docsPath: "/primitives/transaction/eip1559/deserialize#error-handling",
			},
		);
	}

	const rlpData = data.slice(1);
	const decoded = decode(rlpData);

	if (decoded.data.type !== "list") {
		throw new DecodingError("Invalid EIP-1559 transaction: expected list", {
			code: -32602,
			context: { type: decoded.data.type },
			docsPath: "/primitives/transaction/eip1559/deserialize#error-handling",
		});
	}

	const fields = decoded.data.value;
	if (fields.length !== 12) {
		throw new DecodingError(
			`Invalid EIP-1559 transaction: expected 12 fields, got ${fields.length}`,
			{
				code: -32602,
				context: { expected: 12, actual: fields.length },
				docsPath: "/primitives/transaction/eip1559/deserialize#error-handling",
			},
		);
	}

	const chainId = decodeUint(fields[0], 32, "chainId");
	const nonce = decodeUint(fields[1], 8, "nonce");
	const maxPriorityFeePerGas = decodeUint(
		fields[2],
		32,
		"maxPriorityFeePerGas",
	);
	const maxFeePerGas = decodeUint(fields[3], 32, "maxFeePerGas");
	const gasLimit = decodeUint(fields[4], 8, "gasLimit");
	const to = decodeAddress(decodeBytesField(fields[5], "to"));
	const value = decodeUint(fields[6], 32, "value");
	const dataBytes = decodeBytesField(fields[7], "data");
	const accessList = decodeAccessList(decodeListField(fields[8], "accessList"));
	const yParity = decodeYParity(fields[9]);
	const r = decodeSignatureScalar(decodeBytesField(fields[10], "r"));
	const s = decodeSignatureScalar(decodeBytesField(fields[11], "s"));

	return /** @type {import('./TransactionEIP1559Type.js').BrandedTransactionEIP1559} */ (
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

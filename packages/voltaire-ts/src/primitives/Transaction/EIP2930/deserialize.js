import { DecodingError, InvalidFormatError } from "../../errors/index.js";
import { decode } from "../../Rlp/decode.js";
import { Type } from "../types.js";
import {
	decodeAccessList,
	decodeAddress,
	decodeBytesField,
	decodeSignatureScalar,
	decodeUint,
	decodeYParity,
} from "../utils.js";

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
				code: -32602,
				context: { typeByte: data[0] },
				docsPath: "/primitives/transaction/eip2930/deserialize#error-handling",
			},
		);
	}

	const rlpData = data.slice(1);
	const decoded = decode(rlpData);

	if (decoded.data.type !== "list") {
		throw new DecodingError("Invalid EIP-2930 transaction: expected list", {
			code: -32602,
			context: { type: decoded.data.type },
			docsPath: "/primitives/transaction/eip2930/deserialize#error-handling",
		});
	}

	const fields = decoded.data.value;
	if (fields.length !== 11) {
		throw new DecodingError(
			`Invalid EIP-2930 transaction: expected 11 fields, got ${fields.length}`,
			{
				code: -32602,
				context: { expected: 11, actual: fields.length },
				docsPath: "/primitives/transaction/eip2930/deserialize#error-handling",
			},
		);
	}

	const chainId = decodeUint(fields[0], 32, "chainId");
	const nonce = decodeUint(fields[1], 8, "nonce");
	const gasPrice = decodeUint(fields[2], 32, "gasPrice");
	const gasLimit = decodeUint(fields[3], 8, "gasLimit");
	const to = decodeAddress(decodeBytesField(fields[4], "to"));
	const value = decodeUint(fields[5], 32, "value");
	const dataBytes = decodeBytesField(fields[6], "data");
	const accessListField = fields[7];
	if (accessListField?.type !== "list") {
		throw new InvalidFormatError(
			"Invalid EIP-2930 transaction: expected list for accessList",
			{
				code: -32602,
				value: accessListField,
				expected: "List of access list items",
				docsPath: "/primitives/transaction/eip2930/deserialize#error-handling",
			},
		);
	}
	const accessList = decodeAccessList(accessListField.value);
	const yParity = decodeYParity(fields[8]);
	const r = decodeSignatureScalar(decodeBytesField(fields[9], "r"));
	const s = decodeSignatureScalar(decodeBytesField(fields[10], "s"));

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

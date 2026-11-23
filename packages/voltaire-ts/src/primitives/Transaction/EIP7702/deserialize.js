import { DecodingError } from "../../errors/index.js";
import { decode } from "../../Rlp/decode.js";
import { Type } from "../types.js";
import {
	decodeAccessList,
	decodeAuthorizationList,
	decodeBytesField,
	decodeListField,
	decodeSignatureScalar,
	decodeUint,
	decodeYParity,
} from "../utils.js";

/**
 * Deserialize RLP encoded EIP-7702 transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP encoded transaction bytes with type prefix
 * @returns {import('../types.js').EIP7702} Deserialized transaction
 * @throws {DecodingError} If transaction is invalid or malformed
 * @example
 * ```javascript
 * import { deserialize } from './primitives/Transaction/EIP7702/deserialize.js';
 * const tx = deserialize(bytes);
 * ```
 */
export function deserialize(data) {
	if (data.length === 0 || data[0] !== Type.EIP7702) {
		throw new DecodingError(
			"Invalid EIP-7702 transaction: missing or wrong type byte",
			{
				code: -32602,
				context: { typeByte: data[0] },
				docsPath: "/primitives/transaction/eip7702/deserialize#error-handling",
			},
		);
	}

	const rlpData = data.slice(1);
	const decoded = decode(rlpData);

	if (decoded.data.type !== "list") {
		throw new DecodingError("Invalid EIP-7702 transaction: expected list", {
			code: -32602,
			context: { type: decoded.data.type },
			docsPath: "/primitives/transaction/eip7702/deserialize#error-handling",
		});
	}

	const fields = decoded.data.value;
	if (fields.length !== 13) {
		throw new DecodingError(
			`Invalid EIP-7702 transaction: expected 13 fields, got ${fields.length}`,
			{
				code: -32602,
				context: { expected: 13, actual: fields.length },
				docsPath: "/primitives/transaction/eip7702/deserialize#error-handling",
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
	const toBytes = decodeBytesField(fields[5], "to");
	if (toBytes.length !== 20) {
		throw new DecodingError(
			"EIP-7702 transaction to address must be 20 bytes (cannot be null)",
			{
				code: -32602,
				context: { length: toBytes.length },
				docsPath: "/primitives/transaction/eip7702/deserialize#error-handling",
			},
		);
	}
	const to = /** @type {import('../../Address/index.js').AddressType} */ (
		toBytes
	);
	const value = decodeUint(fields[6], 32, "value");
	const dataBytes = decodeBytesField(fields[7], "data");
	const accessList = decodeAccessList(decodeListField(fields[8], "accessList"));
	const authorizationField = fields[9];
	if (
		authorizationField?.type !== "list" ||
		authorizationField.value.length === 0
	) {
		throw new DecodingError(
			"EIP-7702 transaction must have a non-empty authorization list",
			{
				code: -32602,
				context: { type: authorizationField?.type },
				docsPath: "/primitives/transaction/eip7702/deserialize#error-handling",
			},
		);
	}
	const authorizationList = decodeAuthorizationList(authorizationField);
	const yParity = decodeYParity(fields[10]);
	const r = decodeSignatureScalar(decodeBytesField(fields[11], "r"));
	const s = decodeSignatureScalar(decodeBytesField(fields[12], "s"));

	return {
		type: Type.EIP7702,
		chainId,
		nonce,
		maxPriorityFeePerGas,
		maxFeePerGas,
		gasLimit,
		to,
		value,
		data: dataBytes,
		accessList,
		authorizationList,
		yParity,
		r,
		s,
	};
}

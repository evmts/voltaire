import { COMMITMENT_VERSION_KZG } from "../../Blob/constants.js";
import { DecodingError } from "../../errors/index.js";
import { decode } from "../../Rlp/decode.js";
import { Type } from "../types.js";
import {
	decodeAccessList,
	decodeBytesField,
	decodeListField,
	decodeSignatureScalar,
	decodeUint,
	decodeYParity,
} from "../utils.js";

/**
 * Deserialize RLP encoded EIP-4844 transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP encoded transaction with type prefix
 * @returns {import('../types.js').EIP4844} Deserialized transaction
 * @throws {DecodingError} If data is invalid or malformed
 * @example
 * ```javascript
 * import { deserialize } from './primitives/Transaction/EIP4844/deserialize.js';
 * const tx = deserialize(encodedData);
 * ```
 */
export function deserialize(data) {
	if (data.length === 0 || data[0] !== Type.EIP4844) {
		throw new DecodingError(
			"Invalid EIP-4844 transaction: missing or wrong type byte",
			{
				code: -32602,
				context: { typeByte: data[0] },
				docsPath: "/primitives/transaction/eip4844/deserialize#error-handling",
			},
		);
	}

	const rlpData = data.slice(1);
	const decoded = decode(rlpData);

	if (decoded.data.type !== "list") {
		throw new DecodingError("Invalid EIP-4844 transaction: expected list", {
			code: -32602,
			context: { type: decoded.data.type },
			docsPath: "/primitives/transaction/eip4844/deserialize#error-handling",
		});
	}

	const fields = decoded.data.value;
	if (fields.length !== 14) {
		throw new DecodingError(
			`Invalid EIP-4844 transaction: expected 14 fields, got ${fields.length}`,
			{
				code: -32602,
				context: { expected: 14, actual: fields.length },
				docsPath: "/primitives/transaction/eip4844/deserialize#error-handling",
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
			"EIP-4844 transaction to address must be 20 bytes (cannot be null)",
			{
				code: -32602,
				context: { length: toBytes.length },
				docsPath: "/primitives/transaction/eip4844/deserialize#error-handling",
			},
		);
	}
	const to = /** @type {import('../../Address/index.js').AddressType} */ (
		toBytes
	);
	const value = decodeUint(fields[6], 32, "value");
	const dataBytes = decodeBytesField(fields[7], "data");
	const accessList = decodeAccessList(decodeListField(fields[8], "accessList"));
	const maxFeePerBlobGas = decodeUint(fields[9], 32, "maxFeePerBlobGas");

	const blobHashes = decodeListField(fields[10], "blobVersionedHashes");
	if (blobHashes.length === 0) {
		throw new DecodingError(
			"EIP-4844 transaction must have at least one blob versioned hash",
			{
				code: -32602,
				context: { length: 0 },
				docsPath: "/primitives/transaction/eip4844/deserialize#error-handling",
			},
		);
	}
	const blobVersionedHashes = blobHashes.map((hashData, index) => {
		if (hashData.type !== "bytes" || hashData.value.length !== 32) {
			throw new DecodingError("Invalid blob versioned hash", {
				code: -32602,
				context: { type: hashData.type, length: hashData.value.length },
				docsPath: "/primitives/transaction/eip4844/deserialize#error-handling",
			});
		}
		// EIP-4844: Version byte must be COMMITMENT_VERSION_KZG (0x01)
		if (hashData.value[0] !== COMMITMENT_VERSION_KZG) {
			throw new DecodingError(
				`Invalid blob versioned hash version byte at index ${index}: expected 0x01, got 0x${Number(hashData.value[0]).toString(16).padStart(2, "0")}`,
				{
					code: "INVALID_BLOB_HASH_VERSION",
					context: {
						index,
						versionByte: hashData.value[0],
						expected: COMMITMENT_VERSION_KZG,
					},
					docsPath:
						"/primitives/transaction/eip4844/deserialize#error-handling",
				},
			);
		}
		return /** @type {import('../../Hash/index.js').HashType} */ (
			hashData.value
		);
	});

	const yParity = decodeYParity(fields[11]);
	const r = decodeSignatureScalar(decodeBytesField(fields[12], "r"));
	const s = decodeSignatureScalar(decodeBytesField(fields[13], "s"));

	return {
		type: Type.EIP4844,
		chainId,
		nonce,
		maxPriorityFeePerGas,
		maxFeePerGas,
		gasLimit,
		to,
		value,
		data: dataBytes,
		accessList,
		maxFeePerBlobGas,
		blobVersionedHashes,
		yParity,
		r,
		s,
	};
}

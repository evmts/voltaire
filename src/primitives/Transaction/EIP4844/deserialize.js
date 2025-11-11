import { DecodingError } from "../../errors/index.js";
import { decode } from "../../Rlp/BrandedRlp/decode.js";
import { Type } from "../types.js";
import { decodeAccessList, decodeBigint } from "../utils.js";

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
				code: "INVALID_EIP4844_TYPE_BYTE",
				context: { typeByte: data[0] },
				docsPath: "/primitives/transaction/eip4844/deserialize#error-handling",
			},
		);
	}

	const rlpData = data.slice(1);
	const decoded = decode(rlpData);

	if (decoded.data.type !== "list") {
		throw new DecodingError("Invalid EIP-4844 transaction: expected list", {
			code: "INVALID_EIP4844_FORMAT",
			context: { type: decoded.data.type },
			docsPath: "/primitives/transaction/eip4844/deserialize#error-handling",
		});
	}

	const fields = decoded.data.value;
	if (fields.length !== 14) {
		throw new DecodingError(
			`Invalid EIP-4844 transaction: expected 14 fields, got ${fields.length}`,
			{
				code: "INVALID_EIP4844_FIELD_COUNT",
				context: { expected: 14, actual: fields.length },
				docsPath: "/primitives/transaction/eip4844/deserialize#error-handling",
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
	const toBytes = /** @type {{ type: "bytes"; value: Uint8Array }} */ (
		fields[5]
	).value;
	if (toBytes.length !== 20) {
		throw new DecodingError(
			"EIP-4844 transaction to address must be 20 bytes (cannot be null)",
			{
				code: "INVALID_EIP4844_TO_ADDRESS",
				context: { length: toBytes.length },
				docsPath: "/primitives/transaction/eip4844/deserialize#error-handling",
			},
		);
	}
	const to = /** @type {import('../../Address/index.js').BrandedAddress} */ (
		toBytes
	);
	const value = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[6]).value,
	);
	const dataBytes = /** @type {{ type: "bytes"; value: Uint8Array }} */ (
		fields[7]
	).value;
	const accessList = decodeAccessList(/** @type {any} */ (fields[8]).value);
	const maxFeePerBlobGas = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[9]).value,
	);

	const blobHashesData = /** @type {any} */ (fields[10]);
	if (blobHashesData.type !== "list") {
		throw new DecodingError("Invalid blob versioned hashes", {
			code: "INVALID_BLOB_HASHES_FORMAT",
			context: { type: blobHashesData.type },
			docsPath: "/primitives/transaction/eip4844/deserialize#error-handling",
		});
	}
	const blobVersionedHashes = blobHashesData.value.map(
		(/** @type {any} */ hashData) => {
			if (hashData.type !== "bytes" || hashData.value.length !== 32) {
				throw new DecodingError("Invalid blob versioned hash", {
					code: "INVALID_BLOB_HASH",
					context: { type: hashData.type, length: hashData.value?.length },
					docsPath:
						"/primitives/transaction/eip4844/deserialize#error-handling",
				});
			}
			return /** @type {import('../../Hash/index.js').BrandedHash} */ (
				hashData.value
			);
		},
	);

	const yParityBytes = /** @type {{ type: "bytes"; value: Uint8Array }} */ (
		fields[11]
	).value;
	const yParity =
		yParityBytes.length > 0 ? /** @type {number} */ (yParityBytes[0]) : 0;
	const r = /** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[12])
		.value;
	const s = /** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[13])
		.value;

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

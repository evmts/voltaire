import * as Rlp from "../../Rlp/index.js";
import { Type } from "../types.js";
import { decodeAccessList, decodeBigint } from "../utils.js";

/**
 * Deserialize RLP encoded EIP-4844 transaction
 *
 * @param {Uint8Array} data - RLP encoded transaction with type prefix
 * @returns {import('../types.js').EIP4844} Deserialized transaction
 *
 * @example
 * ```typescript
 * const tx = deserialize(encodedData);
 * ```
 */
export function deserialize(data) {
	if (data.length === 0 || data[0] !== Type.EIP4844) {
		throw new Error("Invalid EIP-4844 transaction: missing or wrong type byte");
	}

	const rlpData = data.slice(1);
	const decoded = Rlp.decode(rlpData);

	if (decoded.data.type !== "list") {
		throw new Error("Invalid EIP-4844 transaction: expected list");
	}

	const fields = decoded.data.value;
	if (fields.length !== 14) {
		throw new Error(
			`Invalid EIP-4844 transaction: expected 14 fields, got ${fields.length}`,
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
		throw new Error(
			"EIP-4844 transaction to address must be 20 bytes (cannot be null)",
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
		throw new Error("Invalid blob versioned hashes");
	}
	const blobVersionedHashes = blobHashesData.value.map(
		(/** @type {any} */ hashData) => {
			if (hashData.type !== "bytes" || hashData.value.length !== 32) {
				throw new Error("Invalid blob versioned hash");
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

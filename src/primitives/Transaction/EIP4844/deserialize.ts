import type { Address } from "../../Address/index.js";
import type { Hash } from "../../Hash/index.js";
import { Rlp } from "../../Rlp/index.js";
import { Type, type EIP4844 } from "../types.js";
import {
	decodeBigint,
	decodeAccessList,
} from "../utils.js";

/**
 * Deserialize RLP encoded EIP-4844 transaction
 */
export function deserialize(data: Uint8Array): EIP4844 {
	if (data.length === 0 || data[0] !== Type.EIP4844) {
		throw new Error(
			"Invalid EIP-4844 transaction: missing or wrong type byte",
		);
	}

	const rlpData = data.slice(1);
	const decoded = Rlp.decode.call(rlpData);

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
		(fields[0] as { type: "bytes"; value: Uint8Array }).value,
	);
	const nonce = decodeBigint(
		(fields[1] as { type: "bytes"; value: Uint8Array }).value,
	);
	const maxPriorityFeePerGas = decodeBigint(
		(fields[2] as { type: "bytes"; value: Uint8Array }).value,
	);
	const maxFeePerGas = decodeBigint(
		(fields[3] as { type: "bytes"; value: Uint8Array }).value,
	);
	const gasLimit = decodeBigint(
		(fields[4] as { type: "bytes"; value: Uint8Array }).value,
	);
	const toBytes = (fields[5] as { type: "bytes"; value: Uint8Array }).value;
	if (toBytes.length !== 20) {
		throw new Error(
			"EIP-4844 transaction to address must be 20 bytes (cannot be null)",
		);
	}
	const to = toBytes as Address;
	const value = decodeBigint(
		(fields[6] as { type: "bytes"; value: Uint8Array }).value,
	);
	const dataBytes = (fields[7] as { type: "bytes"; value: Uint8Array })
		.value;
	const accessList = decodeAccessList(
		(fields[8] as { type: "list"; value: Rlp.Data[] }).value,
	);
	const maxFeePerBlobGas = decodeBigint(
		(fields[9] as { type: "bytes"; value: Uint8Array }).value,
	);

	const blobHashesData = fields[10] as { type: "list"; value: Rlp.Data[] };
	if (blobHashesData.type !== "list") {
		throw new Error("Invalid blob versioned hashes");
	}
	const blobVersionedHashes = blobHashesData.value.map((hashData) => {
		if (hashData.type !== "bytes" || hashData.value.length !== 32) {
			throw new Error("Invalid blob versioned hash");
		}
		return hashData.value as Hash;
	});

	const yParityBytes = (fields[11] as { type: "bytes"; value: Uint8Array })
		.value;
	const yParity = yParityBytes.length > 0 ? yParityBytes[0]! : 0;
	const r = (fields[12] as { type: "bytes"; value: Uint8Array }).value;
	const s = (fields[13] as { type: "bytes"; value: Uint8Array }).value;

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

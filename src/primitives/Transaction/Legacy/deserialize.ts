import { Rlp } from "../../Rlp/index.js";
import { Type, type Legacy } from "../types.js";
import { decodeAddress, decodeBigint } from "../utils.js";

/**
 * Deserialize RLP encoded legacy transaction
 */
export function deserialize(data: Uint8Array): Legacy {
	const decoded = Rlp.decode.call(data);
	if (decoded.data.type !== "list") {
		throw new Error("Invalid legacy transaction: expected list");
	}

	const fields = decoded.data.value;
	if (fields.length !== 9) {
		throw new Error(
			`Invalid legacy transaction: expected 9 fields, got ${fields.length}`,
		);
	}

	// Validate all fields are bytes
	for (let i = 0; i < fields.length; i++) {
		if (fields[i]?.type !== "bytes") {
			throw new Error(
				`Invalid legacy transaction: field ${i} must be bytes`,
			);
		}
	}

	// Extract bytes from Data structures
	const nonce = decodeBigint(
		(fields[0] as { type: "bytes"; value: Uint8Array }).value,
	);
	const gasPrice = decodeBigint(
		(fields[1] as { type: "bytes"; value: Uint8Array }).value,
	);
	const gasLimit = decodeBigint(
		(fields[2] as { type: "bytes"; value: Uint8Array }).value,
	);
	const to = decodeAddress(
		(fields[3] as { type: "bytes"; value: Uint8Array }).value,
	);
	const value = decodeBigint(
		(fields[4] as { type: "bytes"; value: Uint8Array }).value,
	);
	const dataBytes = (fields[5] as { type: "bytes"; value: Uint8Array })
		.value;
	const v = decodeBigint(
		(fields[6] as { type: "bytes"; value: Uint8Array }).value,
	);
	const r = (fields[7] as { type: "bytes"; value: Uint8Array }).value;
	const s = (fields[8] as { type: "bytes"; value: Uint8Array }).value;

	return {
		type: Type.Legacy,
		nonce,
		gasPrice,
		gasLimit,
		to,
		value,
		data: dataBytes,
		v,
		r,
		s,
	};
}

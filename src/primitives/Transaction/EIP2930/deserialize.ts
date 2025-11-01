import { Rlp } from "../../Rlp/index.js";
import { Type, type EIP2930 } from "../types.js";
import {
	decodeAddress,
	decodeBigint,
	decodeAccessList,
} from "../utils.js";

/**
 * Deserialize RLP encoded EIP-2930 transaction
 */
export function deserialize(data: Uint8Array): EIP2930 {
	if (data.length === 0 || data[0] !== Type.EIP2930) {
		throw new Error(
			"Invalid EIP-2930 transaction: missing or wrong type byte",
		);
	}

	const rlpData = data.slice(1);
	const decoded = Rlp.decode.call(rlpData);

	if (decoded.data.type !== "list") {
		throw new Error("Invalid EIP-2930 transaction: expected list");
	}

	const fields = decoded.data.value;
	if (fields.length !== 11) {
		throw new Error(
			`Invalid EIP-2930 transaction: expected 11 fields, got ${fields.length}`,
		);
	}

	const chainId = decodeBigint(
		(fields[0] as { type: "bytes"; value: Uint8Array }).value,
	);
	const nonce = decodeBigint(
		(fields[1] as { type: "bytes"; value: Uint8Array }).value,
	);
	const gasPrice = decodeBigint(
		(fields[2] as { type: "bytes"; value: Uint8Array }).value,
	);
	const gasLimit = decodeBigint(
		(fields[3] as { type: "bytes"; value: Uint8Array }).value,
	);
	const to = decodeAddress(
		(fields[4] as { type: "bytes"; value: Uint8Array }).value,
	);
	const value = decodeBigint(
		(fields[5] as { type: "bytes"; value: Uint8Array }).value,
	);
	const dataBytes = (fields[6] as { type: "bytes"; value: Uint8Array })
		.value;
	const accessList = decodeAccessList(
		(fields[7] as { type: "list"; value: Rlp.Data[] }).value,
	);
	const yParityBytes = (fields[8] as { type: "bytes"; value: Uint8Array })
		.value;
	const yParity = yParityBytes.length > 0 ? yParityBytes[0]! : 0;
	const r = (fields[9] as { type: "bytes"; value: Uint8Array }).value;
	const s = (fields[10] as { type: "bytes"; value: Uint8Array }).value;

	return {
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
	};
}

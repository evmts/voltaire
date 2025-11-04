import * as Rlp from "../../Rlp/index.js";
import { Type } from "../types.js";
import type { BrandedTransactionEIP1559 } from "./BrandedTransactionEIP1559.js";
import { decodeAccessList, decodeAddress, decodeBigint } from "../utils.js";

/**
 * Deserialize RLP encoded EIP-1559 transaction
 */
export function deserialize(data: Uint8Array): BrandedTransactionEIP1559 {
	if (data.length === 0 || data[0] !== Type.EIP1559) {
		throw new Error("Invalid EIP-1559 transaction: missing or wrong type byte");
	}

	const rlpData = data.slice(1);
	const decoded = Rlp.decode.call(rlpData);

	if (decoded.data.type !== "list") {
		throw new Error("Invalid EIP-1559 transaction: expected list");
	}

	const fields = decoded.data.value;
	if (fields.length !== 12) {
		throw new Error(
			`Invalid EIP-1559 transaction: expected 12 fields, got ${fields.length}`,
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
	const to = decodeAddress(
		(fields[5] as { type: "bytes"; value: Uint8Array }).value,
	);
	const value = decodeBigint(
		(fields[6] as { type: "bytes"; value: Uint8Array }).value,
	);
	const dataBytes = (fields[7] as { type: "bytes"; value: Uint8Array }).value;
	const accessList = decodeAccessList(
		(fields[8] as { type: "list"; value: Rlp.Data[] }).value,
	);
	const yParityBytes = (fields[9] as { type: "bytes"; value: Uint8Array })
		.value;
	const yParity = yParityBytes.length > 0 ? yParityBytes[0]! : 0;
	const r = (fields[10] as { type: "bytes"; value: Uint8Array }).value;
	const s = (fields[11] as { type: "bytes"; value: Uint8Array }).value;

	return {
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
	};
}

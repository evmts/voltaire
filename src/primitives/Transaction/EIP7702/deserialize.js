import { decode } from "../../Rlp/BrandedRlp/decode.js";
import { Type } from "../types.js";
import {
	decodeAccessList,
	decodeAddress,
	decodeAuthorizationList,
	decodeBigint,
} from "../utils.js";

/**
 * Deserialize RLP encoded EIP-7702 transaction
 *
 * @param {Uint8Array} data - RLP encoded transaction bytes with type prefix
 * @returns {import('../types.js').EIP7702} Deserialized transaction
 * @throws {Error} If transaction is invalid or malformed
 *
 * @example
 * ```javascript
 * const tx = TransactionEIP7702.deserialize(bytes);
 * // { type: 4, chainId: 1n, nonce: 0n, ... }
 * ```
 */
export function deserialize(data) {
	if (data.length === 0 || data[0] !== Type.EIP7702) {
		throw new Error("Invalid EIP-7702 transaction: missing or wrong type byte");
	}

	const rlpData = data.slice(1);
	const decoded = decode(rlpData);

	if (decoded.data.type !== "list") {
		throw new Error("Invalid EIP-7702 transaction: expected list");
	}

	const fields = decoded.data.value;
	if (fields.length !== 13) {
		throw new Error(
			`Invalid EIP-7702 transaction: expected 13 fields, got ${fields.length}`,
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
	const to = decodeAddress(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[5]).value,
	);
	const value = decodeBigint(
		/** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[6]).value,
	);
	const dataBytes = /** @type {{ type: "bytes"; value: Uint8Array }} */ (
		fields[7]
	).value;
	const accessList = decodeAccessList(/** @type {any} */ (fields[8]).value);
	const authorizationList = decodeAuthorizationList(
		/** @type {any} */ (fields[9]).value,
	);
	const yParityBytes = /** @type {{ type: "bytes"; value: Uint8Array }} */ (
		fields[10]
	).value;
	const yParity =
		yParityBytes.length > 0 ? /** @type {number} */ (yParityBytes[0]) : 0;
	const r = /** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[11])
		.value;
	const s = /** @type {{ type: "bytes"; value: Uint8Array }} */ (fields[12])
		.value;

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

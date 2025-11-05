import { encode } from "../../Rlp/encode.js";
import { Type } from "../types.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Serialize EIP-2930 transaction to RLP encoded bytes
 *
 * @param {import('./BrandedTransactionEIP2930.js').BrandedTransactionEIP2930} tx - Transaction to serialize
 * @returns {Uint8Array} RLP encoded transaction bytes
 *
 * @example
 * ```typescript
 * const bytes = TransactionEIP2930.serialize(tx);
 * ```
 */
export function serialize(tx) {
	const fields = [
		encodeBigintCompact(tx.chainId),
		encodeBigintCompact(tx.nonce),
		encodeBigintCompact(tx.gasPrice),
		encodeBigintCompact(tx.gasLimit),
		encodeAddress(tx.to),
		encodeBigintCompact(tx.value),
		tx.data,
		encodeAccessList(tx.accessList),
		new Uint8Array([tx.yParity]),
		tx.r,
		tx.s,
	];
	const rlpEncoded = encode(fields);

	// Prepend type byte 0x01
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP2930;
	result.set(rlpEncoded, 1);
	return result;
}

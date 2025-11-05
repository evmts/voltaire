import { encode } from "../../Rlp/BrandedRlp/encode.js";
import { Type } from "../types.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeAuthorizationList,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Serialize EIP-7702 transaction to RLP encoded bytes
 *
 * @param {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} tx - Transaction to serialize
 * @returns {Uint8Array} RLP encoded transaction with type prefix
 *
 * @example
 * ```javascript
 * const serialized = TransactionEIP7702.serialize(tx);
 * // Uint8Array with 0x04 prefix followed by RLP encoded data
 * ```
 */
export function serialize(tx) {
	const fields = [
		encodeBigintCompact(tx.chainId),
		encodeBigintCompact(tx.nonce),
		encodeBigintCompact(tx.maxPriorityFeePerGas),
		encodeBigintCompact(tx.maxFeePerGas),
		encodeBigintCompact(tx.gasLimit),
		encodeAddress(tx.to),
		encodeBigintCompact(tx.value),
		tx.data,
		encodeAccessList(tx.accessList),
		encodeAuthorizationList(tx.authorizationList),
		new Uint8Array([tx.yParity]),
		tx.r,
		tx.s,
	];
	const rlpEncoded = encode(fields);

	// Prepend type byte 0x04
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP7702;
	result.set(rlpEncoded, 1);
	return result;
}

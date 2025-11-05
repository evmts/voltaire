import { encode } from "../../Rlp/BrandedRlp/encode.js";
import { Type } from "../types.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Serialize EIP-1559 transaction to RLP encoded bytes
 *
 * @param {import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559} tx - Transaction to serialize
 * @returns {Uint8Array} RLP encoded transaction with type byte prefix
 *
 * @example
 * ```typescript
 * const tx = TransactionEIP1559({ chainId: 1n, nonce: 0n, ... });
 * const encoded = serialize(tx);
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
		new Uint8Array([tx.yParity]),
		tx.r,
		tx.s,
	];
	const rlpEncoded = encode(fields);

	// Prepend type byte 0x02
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP1559;
	result.set(rlpEncoded, 1);
	return result;
}

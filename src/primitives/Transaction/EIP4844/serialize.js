import { encode } from "../../Rlp/BrandedRlp/encode.js";
import { Type } from "../types.js";
import { encodeAccessList, encodeBigintCompact } from "../utils.js";

/**
 * Serialize EIP-4844 transaction to RLP encoded bytes
 *
 * @param {import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844} tx - EIP-4844 transaction
 * @returns {Uint8Array} RLP encoded transaction with type prefix
 *
 * @example
 * ```typescript
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
		tx.to, // Note: Cannot be null for blob transactions
		encodeBigintCompact(tx.value),
		tx.data,
		encodeAccessList(tx.accessList),
		encodeBigintCompact(tx.maxFeePerBlobGas),
		tx.blobVersionedHashes.map((h) => h),
		new Uint8Array([tx.yParity]),
		tx.r,
		tx.s,
	];
	const rlpEncoded = encode(fields);

	// Prepend type byte 0x03
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP4844;
	result.set(rlpEncoded, 1);
	return result;
}

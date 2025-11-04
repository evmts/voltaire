import * as Rlp from "../../Rlp/index.js";
import { Type } from "../types.js";
import type { BrandedTransactionEIP4844 } from "./BrandedTransactionEIP4844.js";
import { encodeAccessList, encodeBigintCompact } from "../utils.js";

/**
 * Serialize EIP-4844 transaction to RLP encoded bytes
 */
export function serialize(tx: BrandedTransactionEIP4844): Uint8Array {
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
		tx.blobVersionedHashes.map((h) => h as Uint8Array),
		new Uint8Array([tx.yParity]),
		tx.r,
		tx.s,
	];
	const rlpEncoded = Rlp.encode(fields);

	// Prepend type byte 0x03
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP4844;
	result.set(rlpEncoded, 1);
	return result;
}

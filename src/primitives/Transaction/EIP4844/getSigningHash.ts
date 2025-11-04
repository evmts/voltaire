import { Keccak256 } from "../../../crypto/keccak256.js";
import { Hash, type BrandedHash } from "../../Hash/index.js";
import * as Rlp from "../../Rlp/index.js";
import { Type } from "../types.js";
import type { BrandedTransactionEIP4844 } from "./BrandedTransactionEIP4844.js";
import { encodeAccessList, encodeBigintCompact } from "../utils.js";

/**
 * Get signing hash
 */
export function getSigningHash(tx: BrandedTransactionEIP4844): BrandedHash {
	const fields = [
		encodeBigintCompact(tx.chainId),
		encodeBigintCompact(tx.nonce),
		encodeBigintCompact(tx.maxPriorityFeePerGas),
		encodeBigintCompact(tx.maxFeePerGas),
		encodeBigintCompact(tx.gasLimit),
		tx.to,
		encodeBigintCompact(tx.value),
		tx.data,
		encodeAccessList(tx.accessList),
		encodeBigintCompact(tx.maxFeePerBlobGas),
		tx.blobVersionedHashes.map((h) => h as Uint8Array),
	];
	const rlpEncoded = Rlp.encode(fields);

	// Prepend type byte 0x03
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP4844;
	result.set(rlpEncoded, 1);

	return Keccak256.hash(result);
}

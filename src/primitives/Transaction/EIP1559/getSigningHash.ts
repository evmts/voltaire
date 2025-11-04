import { Keccak256 } from "../../../crypto/keccak256.js";
import type { Hash } from "../../Hash/index.js";
import * as Rlp from "../../Rlp/index.js";
import { Type } from "../types.js";
import type { BrandedTransactionEIP1559 } from "./BrandedTransactionEIP1559.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Get signing hash
 */
export function getSigningHash(tx: BrandedTransactionEIP1559): Hash {
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
	];
	const rlpEncoded = Rlp.encode.call(fields);

	// Prepend type byte 0x02
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP1559;
	result.set(rlpEncoded, 1);

	return Keccak256.hash(result);
}

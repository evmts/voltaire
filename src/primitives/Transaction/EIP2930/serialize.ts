import * as Rlp from "../../Rlp/index.js";
import { Type } from "../types.js";
import type { BrandedTransactionEIP2930 } from "./BrandedTransactionEIP2930.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Serialize EIP-2930 transaction to RLP encoded bytes
 */
export function serialize(tx: BrandedTransactionEIP2930): Uint8Array {
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
	const rlpEncoded = Rlp.encode.call(fields);

	// Prepend type byte 0x01
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP2930;
	result.set(rlpEncoded, 1);
	return result;
}

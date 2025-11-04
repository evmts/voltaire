import * as Rlp from "../../Rlp/index.js";
import { type EIP1559, Type } from "../types.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Serialize EIP-1559 transaction to RLP encoded bytes
 */
export function serialize(this: EIP1559): Uint8Array {
	const fields = [
		encodeBigintCompact(this.chainId),
		encodeBigintCompact(this.nonce),
		encodeBigintCompact(this.maxPriorityFeePerGas),
		encodeBigintCompact(this.maxFeePerGas),
		encodeBigintCompact(this.gasLimit),
		encodeAddress(this.to),
		encodeBigintCompact(this.value),
		this.data,
		encodeAccessList(this.accessList),
		new Uint8Array([this.yParity]),
		this.r,
		this.s,
	];
	const rlpEncoded = Rlp.encode.call(fields);

	// Prepend type byte 0x02
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP1559;
	result.set(rlpEncoded, 1);
	return result;
}

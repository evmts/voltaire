import { Rlp } from "../../Rlp/index.js";
import { Type, type EIP2930 } from "../types.js";
import {
	encodeBigintCompact,
	encodeAddress,
	encodeAccessList,
} from "../utils.js";

/**
 * Serialize EIP-2930 transaction to RLP encoded bytes
 */
export function serialize(this: EIP2930): Uint8Array {
	const fields = [
		encodeBigintCompact(this.chainId),
		encodeBigintCompact(this.nonce),
		encodeBigintCompact(this.gasPrice),
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

	// Prepend type byte 0x01
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP2930;
	result.set(rlpEncoded, 1);
	return result;
}

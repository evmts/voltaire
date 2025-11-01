import { Rlp } from "../../Rlp/index.js";
import { Type, type EIP7702 } from "../types.js";
import {
	encodeBigintCompact,
	encodeAddress,
	encodeAccessList,
	encodeAuthorizationList,
} from "../utils.js";

/**
 * Serialize EIP-7702 transaction to RLP encoded bytes
 */
export function serialize(this: EIP7702): Uint8Array {
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
		encodeAuthorizationList(this.authorizationList),
		new Uint8Array([this.yParity]),
		this.r,
		this.s,
	];
	const rlpEncoded = Rlp.encode.call(fields);

	// Prepend type byte 0x04
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP7702;
	result.set(rlpEncoded, 1);
	return result;
}

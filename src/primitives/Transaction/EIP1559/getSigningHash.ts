import { Keccak256 } from "../../crypto/keccak256.js";
import type { Hash } from "../../Hash/index.js";
import { Rlp } from "../../Rlp/index.js";
import { Type, type EIP1559 } from "../types.js";
import {
	encodeBigintCompact,
	encodeAddress,
	encodeAccessList,
} from "../utils.js";

/**
 * Get signing hash
 */
export function getSigningHash(this: EIP1559): Hash {
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
	];
	const rlpEncoded = Rlp.encode.call(fields);

	// Prepend type byte 0x02
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP1559;
	result.set(rlpEncoded, 1);

	return Keccak256.hash(result);
}

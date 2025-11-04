import { Keccak256 } from "../../../crypto/keccak256.js";
import type { Hash } from "../../Hash/index.js";
import * as Rlp from "../../Rlp/index.js";
import { type EIP2930, Type } from "../types.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Get signing hash
 */
export function getSigningHash(this: EIP2930): Hash {
	const fields = [
		encodeBigintCompact(this.chainId),
		encodeBigintCompact(this.nonce),
		encodeBigintCompact(this.gasPrice),
		encodeBigintCompact(this.gasLimit),
		encodeAddress(this.to),
		encodeBigintCompact(this.value),
		this.data,
		encodeAccessList(this.accessList),
	];
	const rlpEncoded = Rlp.encode.call(fields);

	// Prepend type byte 0x01
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP2930;
	result.set(rlpEncoded, 1);

	return Keccak256.hash(result);
}

import { Keccak256 } from "../../crypto/keccak256.js";
import type { Hash } from "../../Hash/index.js";
import { Rlp } from "../../Rlp/index.js";
import { Type, type EIP4844 } from "../types.js";
import {
	encodeBigintCompact,
	encodeAccessList,
} from "../utils.js";

/**
 * Get signing hash
 */
export function getSigningHash(this: EIP4844): Hash {
	const fields = [
		encodeBigintCompact(this.chainId),
		encodeBigintCompact(this.nonce),
		encodeBigintCompact(this.maxPriorityFeePerGas),
		encodeBigintCompact(this.maxFeePerGas),
		encodeBigintCompact(this.gasLimit),
		this.to,
		encodeBigintCompact(this.value),
		this.data,
		encodeAccessList(this.accessList),
		encodeBigintCompact(this.maxFeePerBlobGas),
		this.blobVersionedHashes.map((h) => h as Uint8Array),
	];
	const rlpEncoded = Rlp.encode.call(fields);

	// Prepend type byte 0x03
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP4844;
	result.set(rlpEncoded, 1);

	return Keccak256.hash(result);
}

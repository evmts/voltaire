import { Rlp } from "../../Rlp/index.js";
import { Type, type EIP4844 } from "../types.js";
import {
	encodeBigintCompact,
	encodeAccessList,
} from "../utils.js";

/**
 * Serialize EIP-4844 transaction to RLP encoded bytes
 */
export function serialize(this: EIP4844): Uint8Array {
	const fields = [
		encodeBigintCompact(this.chainId),
		encodeBigintCompact(this.nonce),
		encodeBigintCompact(this.maxPriorityFeePerGas),
		encodeBigintCompact(this.maxFeePerGas),
		encodeBigintCompact(this.gasLimit),
		this.to, // Note: Cannot be null for blob transactions
		encodeBigintCompact(this.value),
		this.data,
		encodeAccessList(this.accessList),
		encodeBigintCompact(this.maxFeePerBlobGas),
		this.blobVersionedHashes.map((h) => h as Uint8Array),
		new Uint8Array([this.yParity]),
		this.r,
		this.s,
	];
	const rlpEncoded = Rlp.encode.call(fields);

	// Prepend type byte 0x03
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP4844;
	result.set(rlpEncoded, 1);
	return result;
}

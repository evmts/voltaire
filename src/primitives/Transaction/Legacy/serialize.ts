import { Rlp } from "../../Rlp/index.js";
import type { Legacy } from "../types.js";
import {
	encodeBigintCompact,
	encodeAddress,
} from "../utils.js";

/**
 * Serialize legacy transaction to RLP encoded bytes
 */
export function serialize(this: Legacy): Uint8Array {
	const fields = [
		encodeBigintCompact(this.nonce),
		encodeBigintCompact(this.gasPrice),
		encodeBigintCompact(this.gasLimit),
		encodeAddress(this.to),
		encodeBigintCompact(this.value),
		this.data,
		encodeBigintCompact(this.v),
		this.r,
		this.s,
	];
	return Rlp.encode.call(fields);
}

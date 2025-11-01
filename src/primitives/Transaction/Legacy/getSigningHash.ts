import { Keccak256 } from "../../crypto/keccak256.js";
import type { Hash } from "../../Hash/index.js";
import { Rlp } from "../../Rlp/index.js";
import type { Legacy } from "../types.js";
import {
	encodeBigintCompact,
	encodeAddress,
} from "../utils.js";
import { getChainId } from "./getChainId.js";

/**
 * Get signing hash (hash of unsigned transaction for signature generation)
 */
export function getSigningHash(this: Legacy): Hash {
	const chainId = getChainId.call(this);

	if (chainId !== null) {
		// EIP-155: [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]
		const fields = [
			encodeBigintCompact(this.nonce),
			encodeBigintCompact(this.gasPrice),
			encodeBigintCompact(this.gasLimit),
			encodeAddress(this.to),
			encodeBigintCompact(this.value),
			this.data,
			encodeBigintCompact(chainId),
			new Uint8Array(0), // 0
			new Uint8Array(0), // 0
		];
		return Keccak256.hash(Rlp.encode.call(fields));
	}
	// Pre-EIP-155: [nonce, gasPrice, gasLimit, to, value, data]
	const fields = [
		encodeBigintCompact(this.nonce),
		encodeBigintCompact(this.gasPrice),
		encodeBigintCompact(this.gasLimit),
		encodeAddress(this.to),
		encodeBigintCompact(this.value),
		this.data,
	];
	return Keccak256.hash(Rlp.encode.call(fields));
}

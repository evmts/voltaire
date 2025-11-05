import { Keccak256 } from "../../../crypto/Keccak256/index.js";
import { encode } from "../../Rlp/encode.js";
import { encodeAddress, encodeBigintCompact } from "../utils.js";
import { getChainId } from "./getChainId.js";

/**
 * Get signing hash (hash of unsigned transaction for signature generation)
 *
 * @this {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy}
 * @returns {import('../../Hash/index.js').BrandedHash} Hash to be signed
 *
 * @example
 * ```typescript
 * const signingHash = TransactionLegacy.getSigningHash.call(tx);
 * ```
 */
export function getSigningHash() {
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
		return Keccak256.hash(encode(fields));
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
	return Keccak256.hash(encode(fields));
}

import { Keccak256 } from "../../../crypto/keccak256.js";
import { Hash, type BrandedHash } from "../../Hash/index.js";
import * as Rlp from "../../Rlp/index.js";
import type { BrandedTransactionLegacy } from "./BrandedTransactionLegacy.js";
import { encodeAddress, encodeBigintCompact } from "../utils.js";
import { getChainId } from "./getChainId.js";

/**
 * Get signing hash (hash of unsigned transaction for signature generation)
 */
export function getSigningHash(tx: BrandedTransactionLegacy): BrandedHash {
	const chainId = getChainId(tx);

	if (chainId !== null) {
		// EIP-155: [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]
		const fields = [
			encodeBigintCompact(tx.nonce),
			encodeBigintCompact(tx.gasPrice),
			encodeBigintCompact(tx.gasLimit),
			encodeAddress(tx.to),
			encodeBigintCompact(tx.value),
			tx.data,
			encodeBigintCompact(chainId),
			new Uint8Array(0), // 0
			new Uint8Array(0), // 0
		];
		return Keccak256.hash(Rlp.encode(fields));
	}
	// Pre-EIP-155: [nonce, gasPrice, gasLimit, to, value, data]
	const fields = [
		encodeBigintCompact(tx.nonce),
		encodeBigintCompact(tx.gasPrice),
		encodeBigintCompact(tx.gasLimit),
		encodeAddress(tx.to),
		encodeBigintCompact(tx.value),
		tx.data,
	];
	return Keccak256.hash(Rlp.encode(fields));
}

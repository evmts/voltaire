import { Keccak256 } from "../../../crypto/Keccak256/index.js";
import { encode } from "../../Rlp/BrandedRlp/encode.js";
import { encodeAddress, encodeBigintCompact } from "../utils.js";
import { getChainId } from "./getChainId.js";

/**
 * Get signing hash for Legacy transaction.
 *
 * Computes the Keccak256 hash of the RLP-encoded transaction fields that need
 * to be signed. Handles both EIP-155 (with chainId) and pre-EIP-155 formats.
 * The transaction uses BrandedAddress for `to` field, assumed to be validated
 * (20 bytes or null). Returns a BrandedHash (32 bytes).
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @this {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy}
 * @returns {import('../../Hash/index.js').BrandedHash} Signing hash (32 bytes, branded)
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getSigningHash } from './primitives/Transaction/Legacy/getSigningHash.js';
 * const signingHash = getSigningHash.call(tx);
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

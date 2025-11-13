import { encodeAddress, encodeBigintCompact } from "../utils.js";
import { getChainId } from "./getChainId.js";

/**
 * Factory: Get signing hash for Legacy transaction.
 *
 * Computes the Keccak256 hash of the RLP-encoded transaction fields that need
 * to be signed. Handles both EIP-155 (with chainId) and pre-EIP-155 formats.
 * The transaction uses BrandedAddress for `to` field, assumed to be validated
 * (20 bytes or null). Returns a BrandedHash (32 bytes).
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: any[]) => Uint8Array} deps.rlpEncode - RLP encode function
 * @returns {(tx: import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy) => import('../../Hash/index.js').BrandedHash} Function that computes signing hash
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { GetSigningHash } from './primitives/Transaction/Legacy/getSigningHash.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * import { encode as rlpEncode } from '../../Rlp/BrandedRlp/encode.js';
 * const getSigningHash = GetSigningHash({ keccak256, rlpEncode });
 * const signingHash = getSigningHash.call(tx);
 * ```
 */
export function GetSigningHash({ keccak256, rlpEncode }) {
	return function getSigningHash() {
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
			return keccak256(rlpEncode(fields));
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
		return keccak256(rlpEncode(fields));
	};
}

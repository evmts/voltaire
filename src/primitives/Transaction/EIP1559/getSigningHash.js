import { Type } from "../types.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Factory: Get signing hash for EIP-1559 transaction.
 *
 * Computes the Keccak256 hash of the RLP-encoded transaction fields that need
 * to be signed. The transaction uses BrandedAddress for `to` field, assumed to be
 * validated (20 bytes). Returns a BrandedHash (32 bytes).
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: any[]) => Uint8Array} deps.rlpEncode - RLP encode function
 * @returns {(tx: import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559) => import('../../Hash/index.js').BrandedHash} Function that computes signing hash
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { GetSigningHash } from './primitives/Transaction/EIP1559/getSigningHash.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * import { encode as rlpEncode } from '../../Rlp/BrandedRlp/encode.js';
 * const getSigningHash = GetSigningHash({ keccak256, rlpEncode });
 * const signingHash = getSigningHash(tx);
 * ```
 */
export function GetSigningHash({ keccak256, rlpEncode }) {
	return function getSigningHash(tx) {
		const fields = [
			encodeBigintCompact(tx.chainId),
			encodeBigintCompact(tx.nonce),
			encodeBigintCompact(tx.maxPriorityFeePerGas),
			encodeBigintCompact(tx.maxFeePerGas),
			encodeBigintCompact(tx.gasLimit),
			encodeAddress(tx.to),
			encodeBigintCompact(tx.value),
			tx.data,
			encodeAccessList(tx.accessList),
		];
		const rlpEncoded = rlpEncode(fields);

		// Prepend type byte 0x02
		const result = new Uint8Array(1 + rlpEncoded.length);
		result[0] = Type.EIP1559;
		result.set(rlpEncoded, 1);

		return keccak256(result);
	};
}

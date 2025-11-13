import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../../Rlp/BrandedRlp/encode.js";
import { Type } from "../types.js";
import { encodeAccessList, encodeBigintCompact } from "../utils.js";

/**
 * Factory: Get signing hash for EIP-4844 transaction.
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: any[]) => Uint8Array} deps.rlpEncode - RLP encode function
 * @returns {(tx: import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844) => import('../../Hash/index.js').BrandedHash} Function that computes signing hash
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { GetSigningHash } from './primitives/Transaction/EIP4844/getSigningHash.js';
 * import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js';
 * import { encode as rlpEncode } from '../../Rlp/BrandedRlp/encode.js';
 * const getSigningHash = GetSigningHash({ keccak256, rlpEncode });
 * const sigHash = getSigningHash(tx);
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
			tx.to,
			encodeBigintCompact(tx.value),
			tx.data,
			encodeAccessList(tx.accessList),
			encodeBigintCompact(tx.maxFeePerBlobGas),
			tx.blobVersionedHashes.map((h) => h),
		];
		const rlpEncoded = rlpEncode(fields);

		// Prepend type byte 0x03
		const result = new Uint8Array(1 + rlpEncoded.length);
		result[0] = Type.EIP4844;
		result.set(rlpEncoded, 1);

		return keccak256(result);
	};
}

// Default export with crypto injected
export const getSigningHash = GetSigningHash({ keccak256, rlpEncode });

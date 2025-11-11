import { Keccak256 } from "../../../crypto/Keccak256/index.js";
import { encode } from "../../Rlp/BrandedRlp/encode.js";
import { Type } from "../types.js";
import { encodeAccessList, encodeBigintCompact } from "../utils.js";

/**
 * Get signing hash for EIP-4844 transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844} tx - EIP-4844 transaction
 * @returns {import('../../Hash/index.js').BrandedHash} Signing hash
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getSigningHash } from './primitives/Transaction/EIP4844/getSigningHash.js';
 * const sigHash = getSigningHash(tx);
 * ```
 */
export function getSigningHash(tx) {
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
	const rlpEncoded = encode(fields);

	// Prepend type byte 0x03
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP4844;
	result.set(rlpEncoded, 1);

	return Keccak256.hash(result);
}
